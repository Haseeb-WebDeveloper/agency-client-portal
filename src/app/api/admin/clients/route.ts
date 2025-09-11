import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const search = (searchParams.get('search') || '').trim();

    const params: any[] = [];
    let whereSql = 'WHERE c."deletedAt" IS NULL';
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      params.push(like);
      whereSql += ` AND LOWER(c.name) LIKE $${params.length}`;
    }

    const totalRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count FROM clients c ${whereSql}`,
      ...params
    );
    const total: number = totalRows?.[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `WITH contract_stats AS (
         SELECT co."clientId",
                SUM(CASE WHEN co.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_contracts,
                SUM(CASE WHEN co.status = 'DRAFT' THEN 1 ELSE 0 END)  AS pending_contracts
         FROM contracts co
         WHERE co."deletedAt" IS NULL
         GROUP BY co."clientId"
       )
       SELECT c.id, c.name, c.description, c.logo, c.website, c."updatedAt",
              COALESCE(cs.active_contracts, 0)  AS active_contracts,
              COALESCE(cs.pending_contracts, 0) AS pending_contracts
       FROM clients c
       LEFT JOIN contract_stats cs ON c.id = cs."clientId"
       ${whereSql}
       ORDER BY c."updatedAt" DESC
       LIMIT ${limit} OFFSET ${offset}`,
      ...params
    );

    const clientsData = rows.map((client) => ({
      id: client.id,
      name: client.name,
      description: client.description || '',
      logo: client.logo,
      website: client.website,
      activeContracts: parseInt(client.active_contracts) || 0,
      pendingOffers: parseInt(client.pending_contracts) || 0,
      lastActivity: client.updatedAt ? new Date(client.updatedAt).toISOString() : new Date().toISOString(),
      teamMembers: [],
      totalTeamMembers: 0,
    }));

    const cacheHeaders = { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' } as const; // 5min + 10min stale

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
    }, { headers: cacheHeaders });
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


    // Create user in Supabase Auth first using admin client
    const supabaseAdmin = await createAdminClient();
    
    console.log('Creating user in Supabase Auth for:', { email, firstName, lastName });
    
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'CLIENT'
      }
    });

    console.log('Supabase Auth response:', { authData, authCreateError });

    if (authCreateError || !authData.user) {
      console.error('Failed to create user in Supabase Auth:', authCreateError);
      
      // If auth creation fails, clean up the client record
      await prisma.client.delete({
        where: { id: client.id }
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to create user in authentication system', 
          details: authCreateError?.message || 'Unknown auth error',
          authError: authCreateError
        },
        { status: 500 }
      );
    }

    // Create primary contact user with real authId
    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
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

    // Send magic link to the newly created user
    // const supabase = await createClient();
    // const { error: magicLinkError } = await supabase.auth.signInWithOtp({
    //   email,
    //   options: {
    //     emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirectTo=/client`
    //   }
    // });

    // if (magicLinkError) {
    //   console.warn('Failed to send magic link:', magicLinkError.message);
    //   // Don't fail the entire operation, just log the warning
    // }

    revalidateTag('clients:list');
    revalidateTag('admin:dashboard');
    
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
    }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}