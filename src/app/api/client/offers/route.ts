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

    const cacheHeaders = { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } as const;

    if (!membership) {
      return NextResponse.json({ offers: [], pagination: { page: 1, limit: 30, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }, { headers: cacheHeaders });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30'), 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const params: any[] = [membership.clientId];
    let whereSql = 'WHERE o."clientId" = $1 AND o."deletedAt" IS NULL';

    if (status) {
      params.push(status);
      whereSql += ` AND o.status = $${params.length}`;
    }

    if (search) {
      const like = `%${search.toLowerCase()}%`;
      params.push(like);
      whereSql += ` AND (LOWER(o.title) LIKE $${params.length} OR LOWER(COALESCE(o.description, '')) LIKE $${params.length})`;
    }

    const totalRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count FROM offers o ${whereSql}`,
      ...params
    );

    const total: number = totalRows?.[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT o.id, o.title, o.description, o.status, o.tags, o.media, o."validUntil", o."createdAt"
       FROM offers o
       ${whereSql}
       ORDER BY o."updatedAt" DESC
       LIMIT ${limit} OFFSET ${offset}`,
      ...params
    );

    const transformed = rows.map((o) => ({
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
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error fetching client offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}


