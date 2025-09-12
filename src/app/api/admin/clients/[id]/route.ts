import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidateTag } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdmin();

    const { id } = await params;

    // Get client with all related data
    const client = await prisma.client.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
        contracts: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            status: true,
            media: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        offers: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            validUntil: true,
            hasReviewed: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        rooms: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const activeContracts = client.contracts.filter(c => c.status === 'ACTIVE').length;
    const pendingContracts = client.contracts.filter(c => c.status === 'DRAFT').length;
    const completedContracts = client.contracts.filter(c => c.status === 'COMPLETED').length;
    
    const pendingOffers = client.offers.filter(o => o.status === 'DRAFT').length;
    const acceptedOffers = client.offers.filter(o => o.status === 'ACCEPTED').length;
    const rejectedOffers = client.offers.filter(o => o.status === 'DECLINED').length;

    // Format team members
    const teamMembers = client.memberships.map(membership => ({
      id: membership.user.id,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      email: membership.user.email,
      role: membership.role,
      isActive: membership.user.isActive,
      joinedAt: membership.createdAt,
    }));

    // Format contracts
    const formattedContracts = client.contracts.map(contract => ({
      id: contract.id,
      title: contract.title,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    }));

    // Format offers
    const formattedOffers = client.offers.map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      status: offer.status,
      validUntil: offer.validUntil,
      hasReviewed: offer.hasReviewed,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    }));

    // Format rooms
    const formattedRooms = client.rooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        description: client.description,
        logo: client.logo,
        website: client.website,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        // Statistics
        stats: {
          contracts: {
            total: client.contracts.length,
            active: activeContracts,
            pending: pendingContracts,
            completed: completedContracts,
          },
          offers: {
            total: client.offers.length,
            pending: pendingOffers,
            accepted: acceptedOffers,
            rejected: rejectedOffers,
          },
          teamMembers: {
            total: teamMembers.length,
            active: teamMembers.filter(m => m.isActive).length,
          },
        },
        // Related data
        teamMembers,
        contracts: formattedContracts,
        offers: formattedOffers,
        rooms: formattedRooms,
      },
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      description, 
      website, 
      logo,
      firstName,
      lastName,
      email,
      clientMembers = []
    } = body;

    // Validate required fields
    if (!name || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        description: description || '',
        website: website || null,
        logo: logo || null,
      },
    });

    // Update primary contact user if provided
    if (firstName && lastName && email) {
      const primaryMembership = await prisma.clientMembership.findFirst({
        where: {
          clientId: id,
          role: 'PRIMARY_CONTACT',
        },
        include: {
          user: true,
        },
      });

      if (primaryMembership) {
        await prisma.user.update({
          where: { id: primaryMembership.user.id },
          data: {
            firstName,
            lastName,
            email,
          },
        });
      }
    }

    // Handle client members
    if (clientMembers && clientMembers.length > 0) {
      const supabaseAdmin = await createAdminClient();
      
      // Get existing members to determine which ones to delete
      const existingMembers = await prisma.clientMembership.findMany({
        where: {
          clientId: id,
          role: { not: 'PRIMARY_CONTACT' }, // Don't touch primary contact
        },
        include: {
          user: true,
        },
      });

      // Create a map of existing members by email for easy lookup
      const existingMembersMap = new Map(
        existingMembers.map(member => [member.user.email, member])
      );

      // Process each client member
      for (const member of clientMembers) {
        const { firstName, lastName, email, role, isNew } = member;

        if (!firstName || !lastName || !email) {
          continue; // Skip invalid members
        }

        const existingMember = existingMembersMap.get(email);

        if (isNew && !existingMember) {
          // Create new user in Supabase Auth
          const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
              role: 'CLIENT_MEMBER'
            }
          });

          if (authCreateError || !authData.user) {
            console.error('Failed to create user in Supabase Auth:', authCreateError);
            continue; // Skip this member if auth creation fails
          }

          // Create user in database
          const newUser = await prisma.user.create({
            data: {
              authId: authData.user.id,
              firstName,
              lastName,
              email,
              role: 'CLIENT_MEMBER',
              isActive: true,
            },
          });

          // Create client membership
          await prisma.clientMembership.create({
            data: {
              userId: newUser.id,
              clientId: id,
              role: role || 'member',
            },
          });
        } else if (existingMember) {
          // Update existing member
          await prisma.user.update({
            where: { id: existingMember.user.id },
            data: {
              firstName,
              lastName,
              email,
            },
          });

          // Update membership role if changed
          if (role && role !== existingMember.role) {
            await prisma.clientMembership.update({
              where: { id: existingMember.id },
              data: { role },
            });
          }

          // Remove from map so we know it's been processed
          existingMembersMap.delete(email);
        }
      }

      // Delete members that are no longer in the list
      for (const [, member] of existingMembersMap) {
        // Soft delete the membership
        await prisma.clientMembership.update({
          where: { id: member.id },
          data: { 
            deletedAt: new Date(),
            isActive: false,
          },
        });

        // Soft delete the user
        await prisma.user.update({
          where: { id: member.user.id },
          data: { 
            deletedAt: new Date(),
            isActive: false,
          },
        });
      }
    }

    revalidateTag('clients:list');
    revalidateTag('admin:dashboard');

    return NextResponse.json({
      success: true,
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        description: updatedClient.description,
        logo: updatedClient.logo,
        website: updatedClient.website,
      },
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}
