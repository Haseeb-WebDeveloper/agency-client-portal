import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH /api/client/offers/[id]/seen called with offerId:', params.id);
    
    const user = await getCurrentUser();
    console.log('Current user:', user.id);
    
    const membership = await prisma.clientMembership.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      select: { clientId: true },
    });

    if (!membership) {
      console.log('No membership found for user');
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    console.log('User membership clientId:', membership.clientId);
    const offerId = params.id;

    // Verify the offer belongs to the user's client
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        clientId: membership.clientId,
        deletedAt: null,
      },
    });

    if (!offer) {
      console.log('Offer not found for clientId:', membership.clientId);
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    console.log('Found offer:', { id: offer.id, status: offer.status, hasReviewed: offer.hasReviewed });

    // Update the offer to mark as seen
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        hasReviewed: true,
        status: offer.status === 'SENT' ? 'SEEN' : offer.status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        hasReviewed: true,
        status: true,
      },
    });

    console.log('Updated offer:', updatedOffer);

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
    });
  } catch (error) {
    console.error('Error updating offer seen state:', error);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}
