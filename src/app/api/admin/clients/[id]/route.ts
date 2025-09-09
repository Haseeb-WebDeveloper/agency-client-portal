import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

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
            value: true,
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
      value: contract.value,
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
      email
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
