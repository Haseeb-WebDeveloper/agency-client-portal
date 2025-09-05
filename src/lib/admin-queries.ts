import { prisma } from './prisma';

/**
 * Get dashboard statistics for admin
 * Note: This works with the actual database schema, not the Prisma schema
 */
export async function getAdminDashboardStats() {
  const [
    contractsStats,
    offersStats,
    clients,
    unreadMessages
  ] = await Promise.all([
    // Contracts statistics
    prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM contracts
      GROUP BY status
    `,
    
    // Offers statistics
    prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM offers
      WHERE "deletedAt" IS NULL
      GROUP BY status
    `,
    
    // Clients with their contract counts
    prisma.$queryRaw`
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
      LIMIT 10
    `,
    
    // Recent messages from last 7 days
    prisma.$queryRaw`
      SELECT 
        m.*,
        u."firstName",
        u."lastName",
        u.avatar
      FROM messages m
      LEFT JOIN users u ON m."userId" = u.id
      WHERE m."createdAt" >= NOW() - INTERVAL '7 days' AND m."deletedAt" IS NULL
      ORDER BY m."createdAt" DESC
      LIMIT 5
    `,
  ]);

  // Process contracts stats
  const contractsData = contractsStats as any[];
  const activeContracts = contractsData.find(stat => stat.status === 'ACTIVE')?.count || 0;
  const draftContracts = contractsData.find(stat => stat.status === 'DRAFT')?.count || 0;

  // Process offers stats
  const offersData = offersStats as any[];
  const newOffers = offersData.find(stat => stat.status === 'SENT')?.count || 0;
  const pendingOffers = offersData.find(stat => stat.status === 'DRAFT')?.count || 0;

  // Process clients data
  const clientsData = clients as any[];
  const clientsWithStats = clientsData.map(client => ({
    id: client.id,
    name: client.name,
    description: client.description || '',
    logo: client.logo,
    website: client.website,
    activeContracts: parseInt(client.active_contracts) || 0,
    pendingOffers: parseInt(client.pending_contracts) || 0,
    lastActivity: client.updatedAt, // Keep as string for serialization
    teamMembers: [], // Empty array for now - will be populated when needed
    totalTeamMembers: 0, // Will be populated when needed
  }));

  // Process messages data
  const messagesData = unreadMessages as any[];
  const processedMessages = messagesData.map(message => ({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    user: {
      id: message.userId,
      firstName: message.firstName || 'Unknown',
      lastName: message.lastName || 'User',
      avatar: message.avatar,
    },
    room: {
      name: 'General', // Default room name
    },
  }));

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
    unreadMessages: processedMessages,
  };
}

/**
 * Get all offers with client information and media
 */
export async function getOffersWithDetails() {
  const offers = await prisma.$queryRaw`
    SELECT 
      o.*,
      c.name as client_name,
      c.logo as client_logo,
      u."firstName" as creator_first_name,
      u."lastName" as creator_last_name
    FROM offers o
    LEFT JOIN clients c ON o."clientId" = c.id
    LEFT JOIN users u ON o."createdBy" = u.id
    WHERE o."deletedAt" IS NULL
    ORDER BY o."createdAt" DESC
  `;

  return offers as any[];
}

/**
 * Get offers by status
 */
export async function getOffersByStatus(status: string) {
  const offers = await prisma.$queryRaw`
    SELECT 
      o.*,
      c.name as client_name,
      c.logo as client_logo,
      u."firstName" as creator_first_name,
      u."lastName" as creator_last_name
    FROM offers o
    LEFT JOIN clients c ON o."clientId" = c.id
    LEFT JOIN users u ON o."createdBy" = u.id
    WHERE o."deletedAt" IS NULL AND o.status = ${status}
    ORDER BY o."createdAt" DESC
  `;

  return offers as any[];
}
