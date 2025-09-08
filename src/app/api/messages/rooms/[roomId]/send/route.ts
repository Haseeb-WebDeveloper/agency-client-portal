import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const content = String(formData.get("content") || "").trim();
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

    // Verify user has access to this room
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

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Use transaction to ensure atomicity and better performance
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          roomId: roomId,
          userId: me.id,
          content: content || (attachmentsInput.length > 0 ? "" : content),
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
        },
      });

      if (attachmentsInput.length > 0) {
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
      }

      // Update room's updatedAt in the same transaction
      await tx.room.update({
        where: { id: roomId },
        data: { updatedAt: new Date(), updatedBy: me.id },
      });

      return message;
    });

    const message = await prisma.message.findUnique({
      where: { id: result.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        attachments: true,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
