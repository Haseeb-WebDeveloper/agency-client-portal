import { prisma } from './prisma';

/**
 * Get dashboard statistics for client
 * Returns contracts count and offers to review for the specific client
 */
export async function getClientDashboardStats(userId: string) {
  // First get the client ID from user's client membership
  const clientMembership = await prisma.clientMembership.findFirst({
    where: {
      userId: userId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      clientId: true,
    },
  });

  if (!clientMembership) {
    throw new Error('User is not associated with any client');
  }

  const clientId = clientMembership.clientId;

  const [
    contractsStats,
    offersToReview,
    offersPending
  ] = await Promise.all([
    // Contracts statistics for the specific client
    prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM contracts
      WHERE "clientId" = ${clientId} AND "deletedAt" IS NULL
      GROUP BY status
    `,
    
    // Offers with SENT status and has_reviewed = false for the specific client
    prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM offers
      WHERE "clientId" = ${clientId} AND status = 'SENT' AND "hasReviewed" = false AND "deletedAt" IS NULL
    `,
    
    // Offers with SENT status and has_reviewed = true but not accepted/declined/expired
    prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM offers
      WHERE "clientId" = ${clientId} AND status = 'SENT' AND "hasReviewed" = true AND "deletedAt" IS NULL
    `,
  ]);

  // Process contracts stats
  const contractsData = contractsStats as any[];
  const activeContracts = contractsData.find(stat => stat.status === 'ACTIVE')?.count || 0;

  // Process offers to review
  const offersToReviewData = offersToReview as any[];
  const offersToReviewCount = parseInt(offersToReviewData[0]?.count) || 0;

  // Process offers pending
  const offersPendingData = offersPending as any[];
  const offersPendingCount = parseInt(offersPendingData[0]?.count) || 0;

  // Get ongoing contracts with task progress
  const ongoingContracts = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.title,
      c.status,
      COALESCE(task_stats.total_tasks, 0) as total_tasks,
      COALESCE(task_stats.completed_tasks, 0) as completed_tasks
    FROM contracts c
    LEFT JOIN (
      SELECT 
        "contractId",
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks
      WHERE "deletedAt" IS NULL
      GROUP BY "contractId"
    ) task_stats ON c.id = task_stats."contractId"
    WHERE c."clientId" = ${clientId} 
      AND c.status IN ('DRAFT', 'ACTIVE', 'PENDING_APPROVAL') 
      AND c."deletedAt" IS NULL
    ORDER BY c."updatedAt" DESC
    LIMIT 5
  `;

  // Get recent messages
  const recentMessages = await prisma.$queryRaw`
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
  `;

  // Process messages data to ensure serialization
  const messagesData = recentMessages as any[];
  const processedMessages = messagesData.map(message => ({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt, // Keep as string
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
      active: parseInt(activeContracts),
    },
    offers: {
      toReview: offersToReviewCount,
      pending: offersPendingCount,
    },
    ongoingContracts: ongoingContracts as any[],
    recentMessages: processedMessages,
  };
}
