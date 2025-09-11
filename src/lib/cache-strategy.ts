// Advanced caching strategy for better UX
// This provides longer client-side caching using localStorage

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class ClientCache {
  private static readonly CACHE_PREFIX = 'admin_cache_';
  private static readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (typeof window === 'undefined') return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    try {
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  static delete(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to delete cached data:', error);
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
      console.warn('Failed to clear cache:', error);
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
      console.warn('Failed to invalidate cache pattern:', error);
    }
  }
}

// Enhanced fetch with client-side caching
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit & { 
    cacheKey?: string;
    ttl?: number;
    revalidate?: number;
    tags?: string[];
  } = {}
): Promise<T> {
  const { cacheKey, ttl = 15 * 60 * 1000, revalidate = 300, tags = [], ...fetchOptions } = options;
  
  // Generate cache key from URL if not provided
  const key = cacheKey || `fetch_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Try to get from client cache first
  const cached = ClientCache.get<T>(key);
  if (cached) {
    return cached;
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
