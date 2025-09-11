import { unstable_cache as cache } from 'next/cache';
import { getAdminDashboardStats as rawGetAdminDashboardStats, getRecentNews as rawGetRecentNews } from './admin-queries';

export const getAdminDashboardStats = cache(
  async () => {
    return rawGetAdminDashboardStats();
  },
  ['admin:dashboard'],
  { revalidate: 300, tags: ['admin:dashboard'] } // 5 minutes
);

export const getRecentNews = cache(
  async (limit: number = 5) => {
    return rawGetRecentNews(limit);
  },
  ['admin:news:recent'],
  { revalidate: 300, tags: ['news:list'] } // 5 minutes
);


