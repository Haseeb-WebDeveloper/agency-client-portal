import { NextRequest, NextResponse } from 'next/server';
import { getOffersWithDetails, getOffersByStatus } from '@/lib/admin-queries';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    console.log('Fetching offers with params:', { page, limit, search, status });

    // Get offers based on filters
    let offers;
    if (status) {
      offers = await getOffersByStatus(status);
    } else {
      offers = await getOffersWithDetails();
    }

    console.log('Raw offers data:', offers);

    // Apply search filter if provided
    if (search) {
      offers = offers.filter(offer => 
        offer.title.toLowerCase().includes(search.toLowerCase()) ||
        (offer.description && offer.description.toLowerCase().includes(search.toLowerCase())) ||
        offer.client_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Calculate pagination
    const total = offers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOffers = offers.slice(startIndex, endIndex);

    console.log('Paginated offers count:', paginatedOffers.length);

    // Transform offers to match expected format and ensure proper serialization
    const transformedOffers = paginatedOffers.map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      status: offer.status,
      tags: offer.tags || [],
      media: offer.media,
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString() : null,
      createdAt: new Date(offer.createdAt).toISOString(),
      client_name: offer.client_name,
      client_logo: offer.client_logo,
      creator_first_name: offer.creator_first_name,
      creator_last_name: offer.creator_last_name,
    }));

    return NextResponse.json({
      offers: transformedOffers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to fetch offers',
        details: errorMessage,
        // Include stack trace in development only
        ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, clientId, media, validUntil, tags } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'Title and client are required' },
        { status: 400 }
      );
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        status: status || 'DRAFT',
        clientId,
        tags: tags || [],
        media: media || undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
        hasReviewed: false,
      },
    });

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        status: offer.status,
        tags: offer.tags,
        media: offer.media,
        validUntil: offer.validUntil,
        createdAt: offer.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}