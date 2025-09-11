import { unstable_cache as cache } from 'next/cache';
import { getAdminDashboardStats as rawGetAdminDashboardStats, getRecentNews as rawGetRecentNews } from './admin-queries';

export const getAdminDashboardStats = cache(
  async () => {
    return rawGetAdminDashboardStats();
  },
  ['admin:dashboard'],
  { revalidate: 60, tags: ['admin:dashboard'] }
);

export const getRecentNews = cache(
  async (limit: number = 5) => {
    return rawGetRecentNews(limit);
  },
  ['admin:news:recent'],
  { revalidate: 60, tags: ['news:list'] }
);


