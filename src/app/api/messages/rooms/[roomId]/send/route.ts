
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const startTime = performance.now();
  console.log("🚀 [API] Starting message send API at:", new Date().toISOString());
  
  try {
    const { roomId } = await params;
    console.log("📝 [API] Room ID:", roomId);
    
    const authStartTime = performance.now();
    const me = await getCurrentUser();
    const authEndTime = performance.now();
    console.log("🔐 [API] Auth check completed in:", authEndTime - authStartTime, "ms");
    
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formDataStartTime = performance.now();
    const formData = await request.formData();
    const formDataEndTime = performance.now();
    console.log("📋 [API] FormData parsing completed in:", formDataEndTime - formDataStartTime, "ms");
    
    const content = String(formData.get("content") || "").trim();
    const parentIdRaw = formData.get("parentId");
    const parentId = typeof parentIdRaw === "string" && parentIdRaw.length > 0 ? parentIdRaw : null;
    // Attachments come as JSON array of { url, type, name?, size? }
    const attachmentsJson = String(formData.get("attachments") || "");
    let attachmentsInput: Array<{ url: string; type?: string; name?: string; size?: number }> = [];
    if (attachmentsJson) {
      try {
        const parsed = JSON.parse(attachmentsJson);
        if (Array.isArray(parsed)) attachmentsInput = parsed;
      } catch {
        return NextResponse.json({ error: "Invalid attachments payload" }, { status: 400 });
      }
    }

    if (!content && attachmentsInput.length === 0) {
      return NextResponse.json({ error: "Message must include text or attachments" }, { status: 400 });
    }
    
    console.log("📝 [API] Content length:", content.length, "Attachments:", attachmentsInput.length);

    // Verify user has access to this room
    const roomCheckStartTime = performance.now();
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        deletedAt: null,
        participants: {
          some: {
            userId: me.id,
            isActive: true,
            deletedAt: null,
          },
        },
      },
    });
    const roomCheckEndTime = performance.now();
    console.log("🏠 [API] Room access check completed in:", roomCheckEndTime - roomCheckStartTime, "ms");

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Create message with attachments in a transaction
    const transactionStartTime = performance.now();
    console.log("💾 [API] Starting database transaction at:", new Date().toISOString());
    
    const message = await prisma.$transaction(async (tx) => {
      const messageCreateStartTime = performance.now();
      const message = await tx.message.create({
        data: {
          roomId: roomId,
          userId: me.id,
          content: content || (attachmentsInput.length > 0 ? "" : content),
          parentId,
          createdBy: me.id,
          updatedBy: me.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          attachments: true,
          parent: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        },
      });
      const messageCreateEndTime = performance.now();
      console.log("📝 [API] Message creation completed in:", messageCreateEndTime - messageCreateStartTime, "ms");

      if (attachmentsInput.length > 0) {
        const attachmentStartTime = performance.now();
        await tx.messageAttachment.createMany({
          data: attachmentsInput.map((a) => ({
            messageId: message.id,
            fileName: a.name || "file",
            filePath: a.url,
            fileSize: typeof a.size === "number" ? Math.floor(a.size) : 0,
            mimeType: a.type || "application/octet-stream",
            createdBy: me.id,
            updatedBy: me.id,
          })),
        });
        const attachmentEndTime = performance.now();
        console.log("📎 [API] Attachment creation completed in:", attachmentEndTime - attachmentStartTime, "ms");
      }

      return message;
    });
    const transactionEndTime = performance.now();
    console.log("💾 [API] Database transaction completed in:", transactionEndTime - transactionStartTime, "ms");

    // Update room separately to avoid transaction issues
    const roomUpdateStartTime = performance.now();
    await prisma.room.update({
      where: { id: roomId },
      data: { updatedAt: new Date(), updatedBy: me.id },
    });
    const roomUpdateEndTime = performance.now();
    console.log("🏠 [API] Room update completed in:", roomUpdateEndTime - roomUpdateStartTime, "ms");

    // Invalidate message cache for this room
    const cacheStartTime = performance.now();
    revalidateTag(`messages:${roomId}`);
    const cacheEndTime = performance.now();
    console.log("🗑️ [API] Cache invalidation completed in:", cacheEndTime - cacheStartTime, "ms");

    const totalTime = performance.now() - startTime;
    console.log("✅ [API] Total API response time:", totalTime, "ms");

    return NextResponse.json({ message });
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error("❌ [API] Error sending message after:", totalTime, "ms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
