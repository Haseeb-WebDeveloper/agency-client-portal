import { unstable_cache as cache } from 'next/cache';
import { 
  getClientDashboardStats as rawGetClientDashboardStats, 
  getClientRecentNews as rawGetClientRecentNews,
  getClientContracts as rawGetClientContracts,
  getClientNews as rawGetClientNews
} from './client-queries';

// Cache client dashboard stats for 5 minutes
export const getClientDashboardStats = cache(
  async (userId: string) => {
    return rawGetClientDashboardStats(userId);
  },
  ['client:dashboard'],
  { revalidate: 300, tags: ['client:dashboard', 'client:contracts', 'client:offers'] }
);

// Cache recent news for 10 minutes (news changes less frequently)
export const getClientRecentNews = cache(
  async (limit: number = 5) => {
    return rawGetClientRecentNews(limit);
  },
  ['client:news'],
  { revalidate: 600, tags: ['client:news'] }
);

// Cache client contracts with pagination
export const getClientContracts = cache(
  async (params: { userId: string; page?: number; limit?: number; search?: string; status?: string; }) => {
    return rawGetClientContracts(params);
  },
  ['client:contracts'],
  { revalidate: 180, tags: ['client:contracts'] }
);

// Cache client news
export const getClientNews = cache(
  async (userId: string) => {
    return rawGetClientNews(userId);
  },
  ['client:news'],
  { revalidate: 600, tags: ['client:news'] }
);

// Cache client membership lookup (frequently accessed)
export const getClientMembership = cache(
  async (userId: string) => {
    const { prisma } = await import('./prisma');
    return prisma.clientMembership.findFirst({
      where: {
        userId: userId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        clientId: true,
      },
    });
  },
  ['client:membership'],
  { revalidate: 3600, tags: ['client:membership'] } // Cache for 1 hour
);
