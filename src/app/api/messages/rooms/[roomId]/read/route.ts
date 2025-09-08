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

    // Mark room as read
    await prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: me.id,
        },
      },
      data: {
        lastReadAt: new Date(),
        updatedBy: me.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking room as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
