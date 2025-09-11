import { prisma } from './prisma';

/**
 * Optimized client dashboard stats with single query
 * This replaces the multiple queries in getClientDashboardStats
 */
export async function getOptimizedClientDashboardStats(userId: string) {
  // First get client membership (cached)
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

  // Single optimized query to get all dashboard data
  const dashboardData = await prisma.$queryRaw<any[]>`
    WITH contract_stats AS (
      SELECT 
        status,
        COUNT(*) as count
      FROM contracts
      WHERE "clientId" = ${clientId} AND "deletedAt" IS NULL
      GROUP BY status
    ),
    offer_stats AS (
      SELECT 
        COUNT(CASE WHEN status = 'SENT' AND "hasReviewed" = false THEN 1 END) as to_review,
        COUNT(CASE WHEN status = 'SENT' AND "hasReviewed" = true THEN 1 END) as pending
      FROM offers
      WHERE "clientId" = ${clientId} AND "deletedAt" IS NULL
    ),
    ongoing_contracts AS (
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
    ),
    recent_messages AS (
      SELECT 
        m.id,
        m.content,
        m."createdAt",
        m."userId",
        u."firstName",
        u."lastName",
        u.avatar,
        m."roomId"
      FROM messages m
      LEFT JOIN users u ON m."userId" = u.id
      WHERE m."createdAt" >= NOW() - INTERVAL '7 days' 
        AND m."deletedAt" IS NULL
      ORDER BY m."createdAt" DESC
      LIMIT 5
    )
    SELECT 
      (SELECT json_agg(row_to_json(contract_stats)) FROM contract_stats) as contract_stats,
      (SELECT row_to_json(offer_stats) FROM offer_stats) as offer_stats,
      (SELECT json_agg(row_to_json(ongoing_contracts)) FROM ongoing_contracts) as ongoing_contracts,
      (SELECT json_agg(row_to_json(recent_messages)) FROM recent_messages) as recent_messages
  `;

  const data = dashboardData[0];
  
  // Process the results
  const contractStats = data.contract_stats || [];
  const offerStats = data.offer_stats || { to_review: 0, pending: 0 };
  const ongoingContracts = data.ongoing_contracts || [];
  const recentMessages = data.recent_messages || [];

  const activeContracts = contractStats.find((stat: any) => stat.status === 'ACTIVE')?.count || 0;

  // Process messages data
  const processedMessages = recentMessages.map((message: any) => ({
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
      id: message.roomId,
      name: 'General',
    },
  }));

  return {
    contracts: {
      active: parseInt(activeContracts),
    },
    offers: {
      toReview: parseInt(offerStats.to_review) || 0,
      pending: parseInt(offerStats.pending) || 0,
    },
    ongoingContracts: ongoingContracts,
    recentMessages: processedMessages,
  };
}

/**
 * Optimized client contracts query with better performance
 */
export async function getOptimizedClientContracts(params: { 
  userId: string; 
  page?: number; 
  limit?: number; 
  search?: string; 
  status?: string; 
}) {
  const { userId, page = 1, limit = 10, search = '', status = '' } = params;

  // Get client membership
  const clientMembership = await prisma.clientMembership.findFirst({
    where: { userId, isActive: true, deletedAt: null },
    select: { clientId: true },
  });

  if (!clientMembership) {
    return { contracts: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  }

  const clientId = clientMembership.clientId;

  // Build optimized query with proper indexing
  const whereConditions = [`c."clientId" = $1`, `c."deletedAt" IS NULL`];
  const queryParams: any[] = [clientId];
  let paramIndex = 1;

  if (status) {
    paramIndex++;
    whereConditions.push(`c.status = $${paramIndex}`);
    queryParams.push(status);
  }

  if (search) {
    paramIndex++;
    const searchPattern = `%${search.toLowerCase()}%`;
    whereConditions.push(`(
      LOWER(c.title) LIKE $${paramIndex} OR 
      LOWER(COALESCE(c.description, '')) LIKE $${paramIndex} OR 
      EXISTS (
        SELECT 1 FROM UNNEST(COALESCE(c.tags, '{}'::text[])) t 
        WHERE LOWER(t) LIKE $${paramIndex}
      )
    )`);
    queryParams.push(searchPattern);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*)::int as count
    FROM contracts c
    WHERE ${whereClause}
  `;

  const totalResult = await prisma.$queryRawUnsafe<any[]>(countQuery, ...queryParams);
  const total = totalResult[0]?.count || 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const offset = (page - 1) * limit;

  // Get paginated data with media files count
  const dataQuery = `
    WITH media_files AS (
      SELECT m."contractId", COUNT(ma.id) as file_count
      FROM messages m
      LEFT JOIN message_attachments ma ON m.id = ma."messageId"
      WHERE m."contractId" IS NOT NULL AND m."deletedAt" IS NULL
      GROUP BY m."contractId"
    )
    SELECT 
      c.id, c.title, c.description, c.status, c.tags, c."progressPercentage",
      c."createdAt",
      COALESCE(media_files.file_count, 0) as media_files_count
    FROM contracts c
    LEFT JOIN media_files ON c.id = media_files."contractId"
    WHERE ${whereClause}
    ORDER BY c."updatedAt" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const contracts = await prisma.$queryRawUnsafe<any[]>(dataQuery, ...queryParams);

  const transformed = contracts.map((c) => ({
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
