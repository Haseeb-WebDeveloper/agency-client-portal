import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
    }
    if (user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: User is not an admin' }, { status: 403 });
    }

    // Simplified query to get rooms with latest messages
    const rooms = await prisma.room.findMany({
      where: {
        deletedAt: null,
        participants: {
          some: {
            userId: user.id,
            isActive: true,
            deletedAt: null
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
      },
      take: 5 // Limit to 5 rooms for the dashboard
    });

    // Process rooms to prepare response
    const processedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      logo: room.logo,
      type: room.type,
      latestMessage: room.messages[0] || null,
    }));

    return NextResponse.json(processedRooms);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    const errorMessage = error.message || 'Failed to fetch messages';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}