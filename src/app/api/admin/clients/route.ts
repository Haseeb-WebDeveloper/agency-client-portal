import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';

    // Build where clause
    const whereClause: any = {
      deletedAt: null,
    };

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get clients
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          logo: true,
          description: true,
          website: true,
          createdAt: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      clients,
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
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}