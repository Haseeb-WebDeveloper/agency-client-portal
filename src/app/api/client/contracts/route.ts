import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Resolve clientId for this user via membership
    const membership = await prisma.clientMembership.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      select: { clientId: true },
    });

    if (!membership) {
      return NextResponse.json({ contracts: [], pagination: {
        page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
      } });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Base select with joins to count media files
    let contracts = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id, c.title, c.description, c.status, c.tags, c."progressPercentage",
        c."createdAt",
        COALESCE(media_files.file_count, 0) as media_files_count
      FROM contracts c
      LEFT JOIN (
        SELECT m."contractId", COUNT(ma.id) as file_count
        FROM messages m
        LEFT JOIN message_attachments ma ON m.id = ma."messageId"
        WHERE m."contractId" IS NOT NULL AND m."deletedAt" IS NULL
        GROUP BY m."contractId"
      ) media_files ON c.id = media_files."contractId"
      WHERE c."clientId" = ${membership.clientId} AND c."deletedAt" IS NULL
      ORDER BY c."updatedAt" DESC`;

    if (status) {
      contracts = contracts.filter((c) => c.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      contracts = contracts.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (Array.isArray(c.tags) ? c.tags : []).some((t: string) => t.toLowerCase().includes(q))
      );
    }

    const total = contracts.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = contracts.slice(startIndex, startIndex + limit);

    const transformed = paginated.map((c) => ({
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
    });
  } catch (error) {
    console.error('Error fetching client contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}


