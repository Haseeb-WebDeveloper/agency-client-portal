import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const membership = await prisma.clientMembership.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      select: { clientId: true },
    });

    if (!membership) {
      return NextResponse.json({ offers: [], pagination: { page: 1, limit: 30, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let offers = await prisma.$queryRaw<any[]>`
      SELECT 
        o.id, o.title, o.description, o.status, o.tags, o.media, o."validUntil", o."createdAt"
      FROM offers o
      WHERE o."clientId" = ${membership.clientId} AND o."deletedAt" IS NULL
      ORDER BY o."updatedAt" DESC`;

    if (status) offers = offers.filter((o) => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      offers = offers.filter((o) =>
        o.title.toLowerCase().includes(q) ||
        (o.description ?? '').toLowerCase().includes(q)
      );
    }

    const total = offers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = offers.slice(startIndex, startIndex + limit);

    const transformed = paginated.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      status: o.status,
      tags: o.tags || [],
      media: o.media || null,
      validUntil: o.validUntil ? new Date(o.validUntil).toISOString() : null,
      createdAt: new Date(o.createdAt).toISOString(),
    }));

    return NextResponse.json({
      offers: transformed,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('Error fetching client offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}


