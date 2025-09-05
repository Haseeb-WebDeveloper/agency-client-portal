import { prisma } from './prisma';

/**
 * Get dashboard statistics for admin
 */
export async function getAdminDashboardStats() {
  const [
    contractsStats,
    offersStats,
    clients,
    unreadMessages
  ] = await Promise.all([
    // Contracts statistics
    prisma.contract.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    }),
    
    // Offers statistics
    prisma.offer.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    }),
    
    // Clients with their contract counts
    prisma.client.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        contracts: {
          where: {
            deletedAt: null,
          },
          select: {
            status: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            contracts: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    }),
    
    // Unread messages (recent messages from last 7 days)
    prisma.message.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
  ]);

  // Process contracts stats
  const activeContracts = contractsStats.find(stat => stat.status === 'ACTIVE')?._count.status || 0;
  const draftContracts = contractsStats.find(stat => stat.status === 'DRAFT')?._count.status || 0;

  // Process offers stats
  const newOffers = offersStats.find(stat => stat.status === 'SENT')?._count.status || 0;
  const pendingOffers = offersStats.find(stat => stat.status === 'DRAFT')?._count.status || 0;

  // Process clients data
  const clientsWithStats = clients.map(client => {
    const activeContracts = client.contracts.filter(c => c.status === 'ACTIVE').length;
    const pendingContracts = client.contracts.filter(c => c.status === 'PENDING_APPROVAL').length;
    const lastActivity = client.contracts.length > 0 
      ? client.contracts.reduce((latest, contract) => 
          contract.updatedAt > latest ? contract.updatedAt : latest, 
          client.contracts[0].updatedAt
        )
      : client.updatedAt;

    return {
      id: client.id,
      name: client.name,
      logo: client.logo,
      activeContracts,
      pendingContracts,
      lastActivity,
    };
  });

  return {
    contracts: {
      active: activeContracts,
      drafts: draftContracts,
    },
    offers: {
      new: newOffers,
      pending: pendingOffers,
    },
    clients: clientsWithStats,
    unreadMessages,
  };
}
