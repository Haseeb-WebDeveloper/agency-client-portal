import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const startTime = performance.now();
  console.log("🚀 [MESSAGES API] Starting messages fetch at:", new Date().toISOString());
  
  try {
    const { roomId } = await params;
    console.log("📝 [MESSAGES API] Room ID:", roomId);
    
    const authStartTime = performance.now();
    const me = await getCurrentUser();
    const authEndTime = performance.now();
    console.log("🔐 [MESSAGES API] Auth check completed in:", authEndTime - authStartTime, "ms");
    
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    console.log("📊 [MESSAGES API] Cursor:", cursor, "Limit:", limit);

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
    console.log("🏠 [MESSAGES API] Room access check completed in:", roomCheckEndTime - roomCheckStartTime, "ms");

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { roomId: roomId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
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
        parent: true,
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    const cacheHeaders = { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } as const;

    return NextResponse.json({
      items: messages.reverse(), // Return in chronological order
      nextCursor,
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
