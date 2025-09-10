import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Reduced default and added max limit
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

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const body = await request.json();
    const { 
      name, 
      description, 
      website, 
      logo,
      firstName,
      lastName,
      email
    } = body;

    // Validate required fields
    if (!name || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        description: description || '',
        website: website || null,
        logo: logo || null,
      },
    });

    // Create primary contact user
    const user = await prisma.user.create({
      data: {
        authId: `temp-${Date.now()}`, // Temporary auth ID, will be updated when user signs up
        firstName,
        lastName,
        email,
        role: 'CLIENT',
        isActive: true,
      },
    });

    // Create client membership
    await prisma.clientMembership.create({
      data: {
        userId: user.id,
        clientId: client.id,
        role: 'PRIMARY_CONTACT',
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        description: client.description,
        logo: client.logo,
        website: client.website,
      },
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}