import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    let whereClause = 'c."deletedAt" IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Build order clause based on sortBy
    let orderClause = 'c."updatedAt" DESC'; // Default order
    switch (sortBy) {
      case 'new':
        orderClause = 'c."createdAt" DESC'; // Newest clients first
        break;
      case 'oldest':
        orderClause = 'c."createdAt" ASC'; // Oldest clients first
        break;
      case 'alphabetical':
        orderClause = 'c.name ASC'; // Alphabetical order
        break;
      default:
        orderClause = 'c."updatedAt" DESC'; // Default: most recently updated
    }

    // Get clients with their related data
    const clientsQuery = `
      SELECT 
        c.*,
        COALESCE(contract_stats.active_contracts, 0) as active_contracts,
        COALESCE(offer_stats.pending_offers, 0) as pending_offers,
        COALESCE(team_stats.team_members, 0) as team_members_count
      FROM clients c
      LEFT JOIN (
        SELECT 
          co."clientId" as client_id,
          COUNT(*) as active_contracts
        FROM contracts co
        WHERE co.status = 'ACTIVE' AND co."deletedAt" IS NULL
        GROUP BY co."clientId"
      ) contract_stats ON c.id = contract_stats.client_id
      LEFT JOIN (
        SELECT 
          "clientId" as client_id,
          COUNT(*) as pending_offers
        FROM offers 
        WHERE status IN ('DRAFT', 'SENT') AND "deletedAt" IS NULL
        GROUP BY "clientId"
      ) offer_stats ON c.id = offer_stats.client_id
      LEFT JOIN (
        SELECT 
          "clientId" as client_id,
          COUNT(*) as team_members
        FROM client_memberships 
        WHERE "isActive" = true AND "deletedAt" IS NULL
        GROUP BY "clientId"
      ) team_stats ON c.id = team_stats.client_id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM clients c
      WHERE ${whereClause}
    `;

    params.push(limit, skip);

    const [clientsResult, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(clientsQuery, ...params),
      prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
    ]);

    const clients = clientsResult as any[];
    const totalCount = (countResult as any[])[0].total;

    // Get team members for each client
    const clientIds = clients.map(c => c.id);
    const teamMembersQuery = `
      SELECT 
        cm."clientId" as client_id,
        u."firstName" as first_name,
        u."lastName" as last_name,
        u.email,
        u.avatar,
        u.id as user_id
      FROM client_memberships cm
      JOIN users u ON cm."userId" = u.id
      WHERE cm."clientId" = ANY($1) AND cm."isActive" = true AND cm."deletedAt" IS NULL
      ORDER BY cm."createdAt" ASC
    `;

    const teamMembersResult = clientIds.length > 0 
      ? await prisma.$queryRawUnsafe(teamMembersQuery, clientIds)
      : [];

    const teamMembersByClient = (teamMembersResult as any[]).reduce((acc, member) => {
      if (!acc[member.client_id]) {
        acc[member.client_id] = [];
      }
      acc[member.client_id].push({
        id: member.user_id || member.email,
        name: `${member.first_name} ${member.last_name}`,
        avatar: member.avatar,
      });
      return acc;
    }, {});

    // Process clients data
    const clientsWithStats = clients.map(client => {
      const teamMembers = teamMembersByClient[client.id] || [];
      const lastActivity = new Date(client.updatedAt);

      return {
        id: client.id,
        name: client.name,
        description: client.description || '',
        logo: client.logo || null,
        website: client.website || null,
        activeContracts: parseInt(client.active_contracts) || 0,
        pendingOffers: parseInt(client.pending_offers) || 0,
        lastActivity: lastActivity.toISOString(),
        teamMembers: teamMembers.slice(0, 5), // Limit to 5 for display
        totalTeamMembers: teamMembers.length,
      };
    });

    const totalPages = Math.ceil(parseInt(totalCount) / limit);

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount),
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
    const adminUser = await requireAdmin();

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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Create Supabase auth user
    const supabase = await createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create client and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the client
      const client = await tx.client.create({
        data: {
          name,
          description: description || null,
          website: website || null,
          logo: logo || null,
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
      });

      // Create the user
      const user = await tx.user.create({
        data: {
          authId: authData.user.id,
          email,
          firstName,
          lastName,
          role: 'CLIENT', // Primary client contact
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
      });

      // Create client membership
      await tx.clientMembership.create({
        data: {
          userId: user.id,
          clientId: client.id,
          role: 'owner', // Primary contact is the owner
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          actorId: adminUser.id,
          verb: 'CREATED',
          targetType: 'client',
          targetId: client.id,
          metadata: {
            client_name: name,
            contact_email: email,
            contact_name: `${firstName} ${lastName}`,
          },
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        },
      });

      return { client, user };
    });

    // Send magic link to the new client
    try {
      const { error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?redirectTo=/client`,
        },
      });

      if (magicLinkError) {
        console.error('Error generating magic link:', magicLinkError);
        // Don't fail the request, just log the error
      }
    } catch (magicLinkError) {
      console.error('Error sending magic link:', magicLinkError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      client: {
        id: result.client.id,
        name: result.client.name,
        description: result.client.description,
        website: result.client.website,
        logo: result.client.logo,
      },
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      },
      message: 'Client created successfully. Magic link sent to their email.',
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
