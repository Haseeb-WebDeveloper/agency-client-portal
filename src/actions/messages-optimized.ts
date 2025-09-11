'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

// Optimized message actions for blazing fast performance

export async function sendMessageOptimized(roomId: string, content: string, parentId?: string | null) {
  const me = await getCurrentUser()
  if (!me) throw new Error('Not authenticated')

  // Single optimized query with transaction
  const result = await prisma.$transaction(async (tx) => {
    // Verify room access and get room in one query
    const room = await tx.room.findFirst({
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
      select: { id: true }
    })

    if (!room) throw new Error('Room not found')

    // Create message with minimal data
    const message = await tx.message.create({
      data: {
        roomId,
        userId: me.id,
        content,
        parentId: parentId || null,
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
        parent: {
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
        },
      },
    })

    // Update room timestamp
    await tx.room.update({
      where: { id: roomId },
      data: { updatedAt: new Date(), updatedBy: me.id },
    })

    return message
  })

  // Invalidate cache
  revalidateTag(`messages:${roomId}`)
  
  return result
}

export async function getMessagesOptimized(roomId: string, cursor?: string | null, limit: number = 50) {
  const me = await getCurrentUser()
  if (!me) return { items: [], nextCursor: null }

  // Single optimized query with proper indexing
  const messages = await prisma.message.findMany({
    where: { 
      roomId, 
      deletedAt: null 
    },
    orderBy: { createdAt: 'desc' },
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
      parent: {
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
      },
    },
  })

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

  return {
    items: messages.reverse(), // Return in chronological order
    nextCursor,
  }
}

export async function markRoomReadOptimized(roomId: string) {
  const me = await getCurrentUser()
  if (!me) return

  // Optimized single query
  await prisma.roomParticipant.updateMany({
    where: {
      roomId,
      userId: me.id,
      isActive: true,
      deletedAt: null,
    },
    data: { lastReadAt: new Date() },
  })
}

export async function getRoomAccessOptimized(roomId: string) {
  const me = await getCurrentUser()
  if (!me) return false

  // Single optimized query to check access
  const participant = await prisma.roomParticipant.findFirst({
    where: {
      roomId,
      userId: me.id,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true }
  })

  return !!participant
}

// Optimized room list with unread counts
export async function getRoomsWithUnreadOptimized() {
  const me = await getCurrentUser()
  if (!me) return []

  // Single query with raw SQL for optimal performance
  const rooms = await prisma.$queryRaw<any[]>`
    SELECT 
      r.id,
      r.name,
      r.logo,
      r.type,
      r."updatedAt",
      COALESCE(lm.content, '') as latest_message_content,
      COALESCE(lm."createdAt", r."createdAt") as latest_message_time,
      COALESCE(unread_counts.unread_count, 0) as unread_count
    FROM rooms r
    LEFT JOIN room_participants rp ON r.id = rp."roomId" AND rp."userId" = ${me.id} AND rp."isActive" = true AND rp."deletedAt" IS NULL
    LEFT JOIN LATERAL (
      SELECT content, "createdAt"
      FROM messages m
      WHERE m."roomId" = r.id AND m."deletedAt" IS NULL
      ORDER BY m."createdAt" DESC
      LIMIT 1
    ) lm ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as unread_count
      FROM messages m
      WHERE m."roomId" = r.id 
        AND m."deletedAt" IS NULL
        AND (rp."lastReadAt" IS NULL OR m."createdAt" > rp."lastReadAt")
    ) unread_counts ON true
    WHERE r."deletedAt" IS NULL
      AND rp."userId" = ${me.id}
    ORDER BY COALESCE(lm."createdAt", r."createdAt") DESC
  `

  return rooms.map(room => ({
    id: room.id,
    name: room.name,
    logo: room.logo,
    type: room.type,
    unread: Number(room.unread_count),
    latestMessage: room.latest_message_content ? {
      content: room.latest_message_content,
      createdAt: room.latest_message_time
    } : null,
  }))
}
