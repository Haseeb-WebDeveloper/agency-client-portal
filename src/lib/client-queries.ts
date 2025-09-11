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
  const activeContracts = parseInt(contractsData.find(stat => stat.status === 'ACTIVE')?.count.toString() || '0') || 0;

  // Process offers to review
  const offersToReviewData = offersToReview as any[];
  const offersToReviewCount = parseInt(offersToReviewData[0]?.count.toString() || '0') || 0;

  // Process offers pending
  const offersPendingData = offersPending as any[];
  const offersPendingCount = parseInt(offersPendingData[0]?.count.toString() || '0') || 0;

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
      id: message.roomId,
      name: 'General', // Default room name
    },
  }));

  // Process ongoing contracts to handle BigInt values
  const processedOngoingContracts = (ongoingContracts as any[]).map(contract => ({
    id: contract.id,
    title: contract.title,
    status: contract.status,
    total_tasks: parseInt(contract.total_tasks.toString() || '0') || 0,
    completed_tasks: parseInt(contract.completed_tasks.toString() || '0') || 0,
  }));

  // Get recent news for client dashboard
  const recentNews = await getClientRecentNews(5);

  return {
    contracts: {
      active: activeContracts,
    },
    offers: {
      toReview: offersToReviewCount,
      pending: offersPendingCount,
    },
    ongoingContracts: processedOngoingContracts,
    recentMessages: processedMessages,
    recentNews: recentNews, // Add recentNews to the returned data
  };
}

/**
 * Get recent news items for client dashboard
 */
export async function getClientRecentNews(limit: number = 5) {
  const newsItems = await prisma.news.findMany({
    where: {
      deletedAt: null
    },
    orderBy: { 
      createdAt: 'desc' 
    },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      featuredImage: true,
    }
  });

  return newsItems;
}

/**
 * Fetch paginated contracts for the current client (for client UI list)
 */
export async function getClientContracts(params: { userId: string; page?: number; limit?: number; search?: string; status?: string; }) {
  const { userId, page = 1, limit = 10, search = '', status = '' } = params;

  // Resolve clientId for this user via membership
  const clientMembership = await prisma.clientMembership.findFirst({
    where: { userId, isActive: true, deletedAt: null },
    select: { clientId: true },
  });

  if (!clientMembership) {
    return { contracts: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  }

  const clientId = clientMembership.clientId;

  let contracts = await prisma.$queryRaw<any[]>`
    SELECT 
      c.id, c.title, c.description, c.status, c.tags, c."progressPercentage",
      c."createdAt",
      COALESCE(media_files.file_count, 0) as media_files_count
    FROM contracts c
    LEFT JOIN (
      SELECT m."contractId", COUNT(ma.id) as file_count
      FROM messages m
      LEFT JOIN message_attachments ma ON m.id = ma."messageId"
      WHERE m."contractId" IS NOT NULL AND m."deletedAt" IS NULL
      GROUP BY m."contractId"
    ) media_files ON c.id = media_files."contractId"
    WHERE c."clientId" = ${clientId} AND c."deletedAt" IS NULL
    ORDER BY c."updatedAt" DESC`;

  if (status) {
    contracts = contracts.filter((c) => c.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    contracts = contracts.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      (Array.isArray(c.tags) ? c.tags : []).some((t: string) => t.toLowerCase().includes(q))
    );
  }

  const total = contracts.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = contracts.slice(startIndex, startIndex + limit);

  const transformed = paginated.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    tags: c.tags || [],
    progressPercentage: c.progressPercentage || 0,
    mediaFilesCount: parseInt(c.media_files_count) || 0,
    createdAt: c.createdAt,
  }));

  return {
    contracts: transformed,
    pagination: {
      page, limit, total, totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get client news items
 */
export async function getClientNews(userId: string) {
  try {
    // First get the user to verify they exist
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is a client or client member
    if (user.role !== 'CLIENT' && user.role !== 'CLIENT_MEMBER') {
      throw new Error('Access denied');
    }

    const news = await prisma.news.findMany({
      where: {
        deletedAt: null,
        OR: [
          { sendToAll: true },
          { sendTo: { has: userId } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        featuredImage: true,
        content: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return news;
  } catch (error) {
    console.error('Error fetching client news:', error);
    throw error;
  }
}
