"use client";

import { memo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { fetchClientData, invalidateClientCache } from "@/lib/client-cache-strategy";

// Define the news item type
interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  featuredImage: string | null;
  content: string;
  createdAt: Date;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

// Memoized news item component
const NewsItemCard = memo(({ newsItem }: { newsItem: NewsItem }) => (
  <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg">
    <div className="flex flex-col md:flex-row gap-6">
      {newsItem.featuredImage && (
        <div className="md:w-1/3">
          <Image
            src={newsItem.featuredImage}
            alt={newsItem.title}
            width={400}
            height={300}
            className="rounded-lg object-cover w-full h-48 md:h-64"
            loading="lazy"
          />
        </div>
      )}
      <div className={newsItem.featuredImage ? "md:w-2/3" : "w-full"}>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {newsItem.title}
        </h2>
        <p className="text-sm text-foreground/60 mb-4">
          {newsItem.creator?.firstName} {newsItem.creator?.lastName} •{" "}
          {new Date(newsItem.createdAt).toLocaleDateString()}
        </p>
        <div
          className="prose prose-invert max-w-none text-foreground/80"
          dangerouslySetInnerHTML={{ __html: newsItem.content }}
        />
      </div>
    </div>
  </div>
));

NewsItemCard.displayName = 'NewsItemCard';

// Memoized loading skeleton
const LoadingSkeleton = memo(() => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg animate-pulse"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="w-full h-48 md:h-64 bg-primary/10 rounded-lg"></div>
          </div>
          <div className="md:w-2/3">
            <div className="h-6 bg-primary/10 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-primary/10 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-primary/10 rounded w-full"></div>
              <div className="h-4 bg-primary/10 rounded w-5/6"></div>
              <div className="h-4 bg-primary/10 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized empty state
const EmptyState = memo(() => (
  <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg">
    <p className="text-center text-foreground/60">
      No news available at the moment.
    </p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Memoized error state
const ErrorState = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg">
    <p className="text-red-500 mb-4">Error: {error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
    >
      Try Again
    </button>
  </div>
));

ErrorState.displayName = 'ErrorState';

export default function OptimizedNewsPage() {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch function
  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchClientData<NewsItem[]>(
        '/api/client/news',
        {
          cacheKey: 'client_news',
          ttl: 10 * 60 * 1000, // 10 minutes cache (news changes less frequently)
          revalidate: 600, // 10 minutes server cache
          tags: ['news']
        }
      );
      
      setNewsData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
      console.error("Error fetching news:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Refresh data function
  const refreshData = useCallback(() => {
    invalidateClientCache('news');
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">News</h1>
        <button
          onClick={refreshData}
          className="text-sm text-foreground/60 hover:text-foreground transition-colors"
          title="Refresh news"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? <LoadingSkeleton /> : null}

      {/* Error State */}
      {error ? <ErrorState error={error} onRetry={refreshData} /> : null}

      {/* Empty State */}
      {!isLoading && !error && newsData.length === 0 ? <EmptyState /> : null}

      {/* News List */}
      {!isLoading && !error && newsData.length > 0 && (
        <div className="space-y-6">
          {newsData.map((newsItem) => (
            <NewsItemCard key={newsItem.id} newsItem={newsItem} />
          ))}
        </div>
      )}
    </div>
  );
}
