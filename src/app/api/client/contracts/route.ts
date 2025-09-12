import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve clientId for this user via membership
    const membership = await prisma.clientMembership.findFirst({
      where: { userId: user?.id, isActive: true, deletedAt: null },
      select: { clientId: true },
    });

    const cacheHeaders = { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } as const;

    if (!membership) {
      return NextResponse.json({ contracts: [], pagination: {
        page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
      } }, { headers: cacheHeaders });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    // Build WHERE and params
    const params: any[] = [membership.clientId];
    let whereSql = 'WHERE c."clientId" = $1 AND c."deletedAt" IS NULL';

    if (status) {
      params.push(status);
      whereSql += ` AND c.status = $${params.length}`;
    }
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      params.push(like);
      whereSql += ` AND (LOWER(c.title) LIKE $${params.length} OR LOWER(COALESCE(c.description, '')) LIKE $${params.length} OR EXISTS (SELECT 1 FROM UNNEST(COALESCE(c.tags, '{}'::text[])) t WHERE LOWER(t) LIKE $${params.length}))`;
    }

    // Count
    const totalRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count
       FROM contracts c
       ${whereSql}`,
      ...params
    );
    const total: number = totalRows?.[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const offset = (page - 1) * limit;

    // Data with media files count
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `WITH media_files AS (
         SELECT m."contractId", COUNT(ma.id) AS file_count
         FROM messages m
         LEFT JOIN message_attachments ma ON m.id = ma."messageId"
         WHERE m."contractId" IS NOT NULL AND m."deletedAt" IS NULL
         GROUP BY m."contractId"
       )
       SELECT 
         c.id, c.title, c.description, c.status, c.tags, c."progressPercentage",
         c."createdAt",
         COALESCE(media_files.file_count, 0) AS media_files_count
       FROM contracts c
       LEFT JOIN media_files ON c.id = media_files."contractId"
       ${whereSql}
       ORDER BY c."updatedAt" DESC
       LIMIT ${limit} OFFSET ${offset}`,
      ...params
    );

    const transformed = rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      tags: c.tags || [],
      progressPercentage: c.progressPercentage || 0,
      mediaFilesCount: parseInt(c.media_files_count) || 0,
      createdAt: new Date(c.createdAt).toISOString(),
    }));

    return NextResponse.json({
      contracts: transformed,
      pagination: {
        page, limit, total, totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error fetching client contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}


