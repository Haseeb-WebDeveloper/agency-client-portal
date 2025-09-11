// Enhanced caching strategy specifically for client pages
// Provides blazing fast performance with intelligent cache management

export interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export class ClientCache {
  private static readonly CACHE_PREFIX = 'client_cache_';
  private static readonly VERSION = '1.0.0';
  private static readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (typeof window === 'undefined') return;

    const entry: ClientCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      version: this.VERSION,
    };

    try {
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to cache client data:', error);
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const entry: ClientCacheEntry<T> = JSON.parse(cached);
      
      // Check version compatibility
      if (entry.version !== this.VERSION) {
        this.delete(key);
        return null;
      }
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached client data:', error);
      return null;
    }
  }

  static delete(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to delete cached client data:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear client cache:', error);
    }
  }

  // Invalidate cache by pattern
  static invalidatePattern(pattern: string): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate client cache pattern:', error);
    }
  }

  // Get cache statistics
  static getStats(): { totalEntries: number; memoryUsage: string; hitRate: number } {
    if (typeof window === 'undefined') return { totalEntries: 0, memoryUsage: '0 KB', hitRate: 0 };

    try {
      const keys = Object.keys(localStorage);
      const clientKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      clientKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) totalSize += item.length;
      });

      return {
        totalEntries: clientKeys.length,
        memoryUsage: `${Math.round(totalSize / 1024)} KB`,
        hitRate: 0, // This would need to be tracked separately
      };
    } catch (error) {
      return { totalEntries: 0, memoryUsage: '0 KB', hitRate: 0 };
    }
  }
}

// Enhanced fetch with client-side caching and optimistic updates
export async function fetchClientData<T>(
  url: string,
  options: RequestInit & { 
    cacheKey?: string;
    ttl?: number;
    revalidate?: number;
    tags?: string[];
    optimistic?: T; // For optimistic updates
  } = {}
): Promise<T> {
  const { 
    cacheKey, 
    ttl = 10 * 60 * 1000, // 10 minutes default
    revalidate = 180, // 3 minutes server cache
    tags = [], 
    optimistic,
    ...fetchOptions 
  } = options;
  
  // Generate cache key from URL if not provided
  const key = cacheKey || `client_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Try to get from client cache first
  const cached = ClientCache.get<T>(key);
  if (cached) {
    // Return cached data immediately
    return cached;
  }

  // If optimistic data provided, return it immediately and fetch in background
  if (optimistic) {
    // Start background fetch
    fetch(url, {
      ...fetchOptions,
      next: { revalidate, tags }
    }).then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        ClientCache.set(key, data, ttl);
      }
    }).catch(console.error);
    
    return optimistic;
  }

  // Fetch from server with Next.js caching
  const response = await fetch(url, {
    ...fetchOptions,
    next: { revalidate, tags }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the result
  ClientCache.set(key, data, ttl);
  
  return data;
}

// Prefetch data for better UX
export function prefetchClientData(url: string, cacheKey?: string): void {
  if (typeof window === 'undefined') return;
  
  const key = cacheKey || `client_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Check if already cached
  if (ClientCache.get(key)) return;
  
  // Start prefetch
  fetch(url, { next: { revalidate: 180 } })
    .then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        ClientCache.set(key, data, 10 * 60 * 1000);
      }
    })
    .catch(console.error);
}

// Cache invalidation helpers
export function invalidateClientCache(type: 'dashboard' | 'contracts' | 'offers' | 'news' | 'all'): void {
  switch (type) {
    case 'dashboard':
      ClientCache.invalidatePattern('dashboard');
      break;
    case 'contracts':
      ClientCache.invalidatePattern('contracts');
      break;
    case 'offers':
      ClientCache.invalidatePattern('offers');
      break;
    case 'news':
      ClientCache.invalidatePattern('news');
      break;
    case 'all':
      ClientCache.clear();
      break;
  }
}
