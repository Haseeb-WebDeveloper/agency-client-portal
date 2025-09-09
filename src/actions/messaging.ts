'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PermissionType, RoomType } from '@prisma/client'

type Pagination = { cursor?: string | null; limit?: number }

async function getCurrentDbUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  const dbUser = await prisma.user.findUnique({ where: { authId: data.user.id } })
  return dbUser
}

export async function listMyRooms() {
  const me = await getCurrentDbUser()
  if (!me) return []

  const rooms = await prisma.room.findMany({
    where: { deletedAt: null, participants: { some: { userId: me.id, isActive: true, deletedAt: null } } },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: { where: { deletedAt: null }, select: { userId: true } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  // Attach unread counts
  const roomIds = rooms.map(r => r.id)
  let unreadMap = new Map<string, number>()
  if (roomIds.length > 0) {
    const unreadByRoom = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT m."roomId" as id, COUNT(1) as unread
      FROM room_participants rp
      JOIN messages m ON m."roomId" = rp."roomId" AND m."deletedAt" IS NULL
      WHERE rp."userId" = ${me.id}
        AND (rp."lastReadAt" IS NULL OR m."createdAt" > rp."lastReadAt")
      GROUP BY m."roomId"
    `)
    unreadMap = new Map(unreadByRoom.map(r => [String(r.id), Number(r.unread)]))
  }

  return rooms.map(r => ({
    id: r.id,
    name: r.name,
    logo: r.logo,
    type: r.type,
    latestMessage: r.messages[0] || null,
    unread: unreadMap.get(r.id) || 0,
  }))
}

export async function searchRoomsAndUsers(term: string) {
  const me = await getCurrentDbUser()
  if (!me) return { rooms: [], users: [] }

  const isAdmin = me.role === 'PLATFORM_ADMIN' || me.role === 'AGENCY_MEMBER'

  const rooms = await prisma.room.findMany({
    where: isAdmin
      ? {
          deletedAt: null,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {
          deletedAt: null,
          participants: { some: { userId: me.id, isActive: true, deletedAt: null } },
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
    select: { id: true, name: true, logo: true },
    take: 10,
  })

  const users = await prisma.user.findMany({
    where: isAdmin
      ? {
          deletedAt: null,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {
          deletedAt: null,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
          // Non-admins: only admins/agency or fellow room participants will be found via UI restriction
        },
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
    take: 10,
  })

  return { rooms, users }
}

export async function createRoomByUserIds(input: { name: string; logo?: string | null; userIds: string[] }) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')
  return createRoom({ name: input.name, description: null, type: 'GENERAL', logo: input.logo || null, participantIds: input.userIds })
}

export async function createRoom(input: { name: string; description?: string | null; type: RoomType; clientId?: string | null; contractId?: string | null; offerId?: string | null; logo?: string | null; participantIds: string[]; permission?: PermissionType }) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')

  const room = await prisma.room.create({
    data: {
      name: input.name,
      description: input.description || null,
      type: input.type,
      clientId: input.clientId || null,
      contractId: input.contractId || null,
      offerId: input.offerId || null,
      logo: input.logo || null,
      createdBy: me.id,
      updatedBy: me.id,
      participants: {
        create: [
          { userId: me.id, permission: 'ADMIN', createdBy: me.id, updatedBy: me.id },
          ...input.participantIds.filter(id => id !== me.id).map(userId => ({ userId, permission: input.permission || 'WRITE', createdBy: me.id, updatedBy: me.id })),
        ],
      },
    },
  })

  revalidatePath('/messages')
  return room
}

export async function addParticipant(roomId: string, userId: string, permission: PermissionType = 'WRITE') {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')
  await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: { isActive: true, permission, updatedBy: me.id, deletedAt: null },
    create: { roomId, userId, permission, createdBy: me.id, updatedBy: me.id },
  })
  revalidatePath(`/messages`)
}

export async function removeParticipant(roomId: string, userId: string) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')
  await prisma.roomParticipant.update({ where: { roomId_userId: { roomId, userId } }, data: { isActive: false, deletedAt: new Date(), updatedBy: me.id } })
  revalidatePath(`/messages`)
}

export async function getRoom(roomId: string) {
  const me = await getCurrentDbUser()
  if (!me) return null
  return prisma.room.findFirst({
    where: { id: roomId, deletedAt: null, participants: { some: { userId: me.id, isActive: true, deletedAt: null } } },
    include: { participants: { where: { deletedAt: null }, include: { user: true } } },
  })
}

export async function getMessages(roomId: string, { cursor, limit = 50 }: Pagination) {
  const me = await getCurrentDbUser()
  if (!me) return { items: [], nextCursor: null as string | null }

  console.log('[actions.getMessages] roomId:', roomId, 'cursor:', cursor, 'limit:', limit)
  const items = await prisma.message.findMany({
    where: { roomId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: { user: true, attachments: true, parent: true },
  })

  const nextCursor = items.length === limit ? items[items.length - 1].id : null
  console.log('[actions.getMessages] fetched items:', items.length, 'nextCursor:', nextCursor)
  return { items, nextCursor }
}

export async function sendMessage(roomId: string, content: string, parentId?: string | null) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')

  console.log('[actions.sendMessage] creating message', { roomId, contentLength: content.length, parentId: parentId || null })
  const msg = await prisma.message.create({
    data: { roomId, userId: me.id, content, parentId: parentId || null, createdBy: me.id, updatedBy: me.id },
    include: { user: true },
  })

  await prisma.room.update({ where: { id: roomId }, data: { updatedAt: new Date(), updatedBy: me.id } })
  console.log('[actions.sendMessage] created message id:', msg.id)
  revalidatePath(`/messages`)
  return msg
}

export async function editMessage(messageId: string, content: string) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')
  return prisma.message.update({ where: { id: messageId }, data: { content, isEdited: true, updatedBy: me.id } })
}

export async function deleteMessage(messageId: string) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')
  return prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date(), updatedBy: me.id } })
}

export async function markRoomRead(roomId: string) {
  const me = await getCurrentDbUser()
  if (!me) return
  await prisma.roomParticipant.update({ where: { roomId_userId: { roomId, userId: me.id } }, data: { lastReadAt: new Date() } })
}

export async function createOrFindDMRoom(otherUserId: string) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')
  
  // First, check if a DM room already exists between these two users
  const existingRoom = await prisma.room.findFirst({
    where: {
      type: 'GENERAL',
      deletedAt: null,
      participants: {
        every: {
          userId: { in: [me.id, otherUserId] },
          isActive: true,
          deletedAt: null
        }
      }
    },
    include: {
      participants: {
        where: { deletedAt: null },
        select: { userId: true }
      }
    }
  })

  // Check if it's actually a 2-person room (DM)
  if (existingRoom && existingRoom.participants.length === 2) {
    return existingRoom
  }

  // Get the other user's details for room naming
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { firstName: true, lastName: true }
  })

  if (!otherUser) {
    throw new Error('User not found')
  }

  // Create a new DM room
  const room = await prisma.room.create({
    data: {
      name: `${me.firstName} & ${otherUser.firstName}`,
      description: `Direct message between ${me.firstName} ${me.lastName} and ${otherUser.firstName} ${otherUser.lastName}`,
      type: 'GENERAL',
      createdBy: me.id,
      updatedBy: me.id,
      participants: {
        create: [
          { userId: me.id, permission: 'ADMIN', createdBy: me.id, updatedBy: me.id },
          { userId: otherUserId, permission: 'WRITE', createdBy: me.id, updatedBy: me.id },
        ],
      },
    },
    include: {
      participants: {
        where: { deletedAt: null },
        select: { userId: true }
      }
    }
  })

  revalidatePath('/messages')
  return room
}

export async function updateRoom(roomId: string, data: {
  name?: string;
  description?: string;
  logo?: string | null;
}) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')

  const room = await prisma.room.update({
    where: { id: roomId },
    data: {
      ...data,
      updatedBy: me.id,
    },
  })

  revalidatePath('/messages')
  return room
}

export async function addRoomMembers(roomId: string, userIds: string[]) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')

  // Add participants
  await prisma.roomParticipant.createMany({
    data: userIds.map(userId => ({
      roomId,
      userId,
      permission: 'WRITE',
      createdBy: me.id,
      updatedBy: me.id,
    })),
    skipDuplicates: true,
  })

  revalidatePath('/messages')
}

export async function removeRoomMember(roomId: string, userId: string) {
  const me = await getCurrentDbUser()
  if (!me) throw new Error('Not authenticated')

  await prisma.roomParticipant.update({
    where: { roomId_userId: { roomId, userId } },
    data: { isActive: false, deletedAt: new Date(), updatedBy: me.id }
  })

  revalidatePath('/messages')
}

export async function getRoomInfo(roomId: string) {
  const me = await getCurrentDbUser()
  if (!me) return null

  return prisma.room.findFirst({
    where: { 
      id: roomId, 
      deletedAt: null, 
      participants: { 
        some: { userId: me.id, isActive: true, deletedAt: null } 
      } 
    },
    include: { 
      participants: { 
        where: { deletedAt: null }, 
        select: {
          permission: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            }
          }
        }
      } 
    },
  })
}

export async function getAvailableUsers() {
  const me = await getCurrentDbUser()
  if (!me) return []

  const isAdmin = me.role === 'PLATFORM_ADMIN' || me.role === 'AGENCY_MEMBER'

  return prisma.user.findMany({
    where: {
      deletedAt: null,
      id: { not: me.id }, // Exclude current user
      ...(isAdmin ? {} : {
        // Non-admins can only see admins/agency members
        role: { in: ['PLATFORM_ADMIN', 'AGENCY_MEMBER'] }
      })
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      role: true,
    },
    orderBy: { firstName: 'asc' }
  })
}

