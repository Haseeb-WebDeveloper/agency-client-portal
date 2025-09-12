'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createRoom } from '@/actions/messaging'

export async function createOrUpdateOffer(offerId: string | null, input: any) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  const me = await prisma.user.findUnique({ where: { authId: data.user.id } })
  if (!me) throw new Error('User not found')

  const payload = {
    title: input.title,
    description: input.description || null,
    status: input.status,
    clientId: input.clientId,
    tags: input.tags || [],
    media: input.media || null,
    updatedBy: me.id,
  }

  let offer
  if (offerId) {
    offer = await prisma.offer.update({ where: { id: offerId }, data: payload })
  } else {
    offer = await prisma.offer.create({ data: { ...payload, createdBy: me.id } })
  }

  // Optional: auto create room
  if (input.messaging?.createRoom) {
    try {
      await createRoom({
        name: input.messaging.roomName || `Offer: ${offer.title}`,
        description: `Discussion for offer ${offer.title}`,
        type: 'CLIENT_SPECIFIC',
        clientId: offer.clientId,
        offerId: offer.id,
        logo: input.messaging.roomLogo || null,
        participantIds: [me.id],
        permission: 'WRITE',
      })
    } catch (e) {
      // Non-fatal
      console.error('Failed to create room for offer', e)
    }
  }

  return offer
}


