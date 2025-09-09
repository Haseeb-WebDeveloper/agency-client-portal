import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: (await params).id },
      include: {
        client: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        rooms: {
          where: {
            offerId: (await params).id,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      status: offer.status,
      media: offer.media,
      validUntil: offer.validUntil,
      hasReviewed: offer.hasReviewed,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      client: {
        id: offer.client.id,
        name: offer.client.name,
        logo: offer.client.logo,
      },
      creator: offer.creator ? {
        firstName: offer.creator.firstName,
        lastName: offer.creator.lastName,
      } : null,
      room: offer.rooms && offer.rooms.length > 0 ? {
        id: offer.rooms[0].id,
        name: offer.rooms[0].name,
        logo: offer.rooms[0].logo,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { title, description, status, clientId, media, validUntil, hasReviewed } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'Title and client are required' },
        { status: 400 }
      );
    }

    // Update the offer
    const offer = await prisma.offer.update({
      where: { id: (await params).id },
      data: {
        title,
        description,
        status,
        clientId,
        media: media || undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
        hasReviewed: hasReviewed || false,
      },
    });

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        status: offer.status,
        media: offer.media || null,
        validUntil: offer.validUntil,
        hasReviewed: offer.hasReviewed,
        updatedAt: offer.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Soft delete the offer
    await prisma.offer.update({
      where: { id: (await params).id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
