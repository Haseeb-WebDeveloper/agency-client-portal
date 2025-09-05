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

    // Get clients with contract statistics
    let clients;
    if (search) {
      clients = await prisma.$queryRaw`
        SELECT 
          c.*,
          COALESCE(contract_stats.active_contracts, 0) as active_contracts,
          COALESCE(contract_stats.pending_contracts, 0) as pending_contracts
        FROM clients c
        LEFT JOIN (
          SELECT 
            co."clientId",
            SUM(CASE WHEN co.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_contracts,
            SUM(CASE WHEN co.status = 'DRAFT' THEN 1 ELSE 0 END) as pending_contracts
          FROM contracts co
          WHERE co."deletedAt" IS NULL
          GROUP BY co."clientId"
        ) contract_stats ON c.id = contract_stats."clientId"
        WHERE c."deletedAt" IS NULL
        AND c.name ILIKE ${'%' + search + '%'}
        ORDER BY c."updatedAt" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
    } else {
      clients = await prisma.$queryRaw`
        SELECT 
          c.*,
          COALESCE(contract_stats.active_contracts, 0) as active_contracts,
          COALESCE(contract_stats.pending_contracts, 0) as pending_contracts
        FROM clients c
        LEFT JOIN (
          SELECT 
            co."clientId",
            SUM(CASE WHEN co.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_contracts,
            SUM(CASE WHEN co.status = 'DRAFT' THEN 1 ELSE 0 END) as pending_contracts
          FROM contracts co
          WHERE co."deletedAt" IS NULL
          GROUP BY co."clientId"
        ) contract_stats ON c.id = contract_stats."clientId"
        WHERE c."deletedAt" IS NULL
        ORDER BY c."updatedAt" DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
    }

    const total = await prisma.client.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(total / limit);

    // Process clients data to ensure proper serialization
    const clientsData = (clients as any[]).map(client => ({
      id: client.id,
      name: client.name,
      description: client.description || '',
      logo: client.logo,
      website: client.website,
      activeContracts: parseInt(client.active_contracts) || 0,
      pendingOffers: parseInt(client.pending_contracts) || 0,
      lastActivity: client.updatedAt ? new Date(client.updatedAt).toISOString() : new Date().toISOString(),
      teamMembers: [], // Empty array for now
      totalTeamMembers: 0, // Will be populated when needed
    }));

    return NextResponse.json({
      clients: clientsData,
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