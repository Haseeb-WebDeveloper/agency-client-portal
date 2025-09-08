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

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
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
          content,
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
        },
      });

      // Update room's updatedAt in the same transaction
      await tx.room.update({
        where: { id: roomId },
        data: { updatedAt: new Date(), updatedBy: me.id },
      });

      return message;
    });

    const message = result;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
