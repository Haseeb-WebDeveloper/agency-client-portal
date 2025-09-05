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
          co.client_id,
          SUM(CASE WHEN co.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_contracts,
          SUM(CASE WHEN co.status = 'DRAFT' THEN 1 ELSE 0 END) as pending_contracts
        FROM contracts co
        WHERE co.deleted_at IS NULL
        GROUP BY co.client_id
      ) contract_stats ON c.id = contract_stats.client_id
      WHERE c.deleted_at IS NULL
      ORDER BY c.updated_at DESC
      LIMIT 10
    `,
    
    // Recent messages from last 7 days
    prisma.$queryRaw`
      SELECT 
        m.*,
        u.first_name,
        u.last_name,
        u.avatar
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.created_at >= NOW() - INTERVAL '7 days' AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
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
    logo: null, // No logo field in current schema
    activeContracts: parseInt(client.active_contracts) || 0,
    pendingContracts: parseInt(client.pending_contracts) || 0,
    lastActivity: new Date(client.updated_at),
  }));

  // Process messages data
  const messagesData = unreadMessages as any[];
  const processedMessages = messagesData.map(message => ({
    id: message.id,
    content: message.content,
    createdAt: message.created_at,
    user: {
      id: message.user_id,
      firstName: message.first_name || 'Unknown',
      lastName: message.last_name || 'User',
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
