import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30'), 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const params: any[] = [];
    let whereSql = 'WHERE o."deletedAt" IS NULL';

    if (status) {
      params.push(status);
      whereSql += ` AND o.status = $${params.length}`;
    }

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      params.push(like);
      whereSql += ` AND (LOWER(o.title) LIKE $${params.length} OR LOWER(COALESCE(o.description, '')) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length})`;
    }

    const [{ count: total }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count
       FROM offers o
       LEFT JOIN clients c ON o."clientId" = c.id
       ${whereSql}`,
      ...params
    );

    const totalPages = Math.max(Math.ceil((total ?? 0) / limit), 1);
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
         o.id,
         o.title,
         o.description,
         o.status,
         o.tags,
         o.media,
         o."validUntil",
         o."createdAt",
         c.name AS client_name,
         c.logo AS client_logo,
         u."firstName" AS creator_first_name,
         u."lastName"  AS creator_last_name
       FROM offers o
       LEFT JOIN clients c ON o."clientId" = c.id
       LEFT JOIN users   u ON o."createdBy" = u.id
       ${whereSql}
       ORDER BY o."updatedAt" DESC
       LIMIT ${limit} OFFSET ${offset}`,
      ...params
    );

    const transformedOffers = rows.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      status: o.status,
      tags: o.tags || [],
      media: o.media || null,
      validUntil: o.validUntil ? new Date(o.validUntil).toISOString() : null,
      createdAt: new Date(o.createdAt).toISOString(),
      client_name: o.client_name,
      client_logo: o.client_logo,
      creator_first_name: o.creator_first_name,
      creator_last_name: o.creator_last_name,
    }));

    const cacheHeaders = { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } as const;

    return NextResponse.json({
      offers: transformedOffers,
      pagination: {
        page,
        limit,
        total: total ?? 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error fetching offers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to fetch offers',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, clientId, media, validUntil } = body;

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
        media: media || undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
        hasReviewed: false,
      },
    });

    revalidateTag('offers:list');
    revalidateTag('admin:dashboard');
    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        status: offer.status,
        media: offer.media,
        validUntil: offer.validUntil,
        createdAt: offer.createdAt,
      },
    }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}