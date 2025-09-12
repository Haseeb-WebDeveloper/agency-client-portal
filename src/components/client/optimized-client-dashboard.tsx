"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { OngoingContracts } from "@/components/client/ongoing-contracts";
import { MessagesCard } from "@/components/client/messages-card";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";
import Link from "next/link";
import Image from "next/image";
import { ClientStatsCards } from "@/components/client/client-stats-cards";
import { fetchClientData, ClientCache } from "@/lib/client-cache-strategy";

interface SerializedData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
    isActive: boolean;
  };
  dashboardData: {
    contracts: {
      active: number;
    };
    offers: {
      toReview: number;
      pending: number;
    };
    ongoingContracts: {
      id: string;
      title: string;
      status: string;
      total_tasks: number;
      completed_tasks: number;
    }[];
    recentMessages: {
      id: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
      };
      room: {
        name: string;
      };
    }[];
    recentNews: {
      id: string;
      title: string;
      description: string;
      featuredImage: string | null;
    }[];
  };
}

// Memoized news item component for better performance
const NewsItem = memo(({ newsItem, index, total }: { 
  newsItem: any; 
  index: number; 
  total: number; 
}) => (
  <Link
    key={newsItem.id}
    href={`/client/news/${newsItem.id}`}
    className={`flex items-center px-5 py-4 ${
      index !== total - 1 ? "border-b border-primary/20" : ""
    } group`}
    style={{ textDecoration: "none" }}
  >
    {/* Image */}
    {newsItem.featuredImage ? (
      <div className="flex-shrink-0 w-20 h-14 rounded overflow-hidden bg-primary/20">
        <Image
          src={newsItem.featuredImage}
          alt={newsItem.title}
          width={80}
          height={56}
          className="object-cover w-20 h-14"
          loading="lazy"
        />
      </div>
    ) : (
      <div className="w-20 h-14 bg-gradient-to-r from-primary to-primary/20 rounded flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-foreground">Featured</span>
      </div>
    )}
    {/* Title */}
    <div className="ml-4 flex-1">
      <div className="text-base font-medium leading-tight text-foreground">
        {newsItem.title}
      </div>
      <div className="text-xs text-foreground/60 mt-1 line-clamp-2">
        {newsItem.description}
      </div>
    </div>
  </Link>
));

NewsItem.displayName = 'NewsItem';

// Memoized recent news card
const RecentNewsCard = memo(({ recentNews }: { recentNews: any[] }) => (
  <div
    className="bg-transparent border border-primary/20 rounded-2xl px-0 py-0 shadow-md"
    style={{ minWidth: 320 }}
  >
    {/* Header */}
    <div className="flex items-center gap-3 px-5 pt-5 pb-3">
      <Image
        src="/icons/news.svg"
        alt="Recent News"
        width={22}
        height={22}
        className="opacity-90"
      />
      <span className="figma-paragraph text-foreground">
        Recent news posted
      </span>
    </div>
    {/* News list */}
    <div>
      {recentNews.length === 0 && (
        <div className="px-5 py-4 text-sm text-foreground/60">
          No news posted yet.
        </div>
      )}
      {recentNews.slice(0, 2).map((newsItem, idx) => (
        <NewsItem 
          key={newsItem.id}
          newsItem={newsItem} 
          index={idx} 
          total={recentNews.slice(0, 2).length} 
        />
      ))}
    </div>
    {/* Footer link */}
    <div className="px-5 py-3 border-t border-primary/20">
      <Link
        href="/client/news"
        className="text-sm text-foreground/80 hover:underline"
      >
        View all news
      </Link>
    </div>
  </div>
));

RecentNewsCard.displayName = 'RecentNewsCard';

// Performance monitoring component
const PerformanceMonitor = memo(() => {
  const [stats, setStats] = useState({ totalEntries: 0, memoryUsage: '0 KB', hitRate: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setStats(ClientCache.getStats());
      const interval = setInterval(() => {
        setStats(ClientCache.getStats());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs z-50">
      <div className="font-bold mb-2">Client Cache Stats</div>
      <div>Entries: {stats.totalEntries}</div>
      <div>Memory: {stats.memoryUsage}</div>
      <div>Hit Rate: {stats.hitRate}%</div>
      <button 
        onClick={() => ClientCache.clear()}
        className="mt-2 px-2 py-1 bg-red-600 rounded text-xs"
      >
        Clear Cache
      </button>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default function OptimizedClientDashboard({
  serializedData,
}: {
  serializedData: SerializedData;
}) {
  const { user, dashboardData } = serializedData;

  // Memoize expensive calculations
  const greeting = useMemo(() => getGreeting(user.firstName), [user.firstName]);
  const greetingSubtitle = useMemo(() => getGreetingSubtitle(), []);

  // Prefetch data for better navigation
  useEffect(() => {
    // Prefetch contracts and offers data
    fetchClientData('/api/client/contracts?page=1&limit=9', {
      cacheKey: 'contracts_page_1',
      ttl: 5 * 60 * 1000, // 5 minutes
    }).catch(console.error);

    fetchClientData('/api/client/offers?page=1&limit=15', {
      cacheKey: 'offers_page_1',
      ttl: 5 * 60 * 1000, // 5 minutes
    }).catch(console.error);
  }, []);

  return (
    <>
      <div className="space-y-6 px-8 py-6">
        {/* Header with greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="figma-h3">{greeting}</h1>
            <p className="mt-1">{greetingSubtitle}</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats cards */}
            <ClientStatsCards
              contracts={dashboardData.contracts}
              offers={dashboardData.offers}
            />

            {/* Ongoing contracts */}
            <OngoingContracts contracts={dashboardData.ongoingContracts} />
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Messages card */}
            <MessagesCard />

            {/* Recent news card */}
            <RecentNewsCard recentNews={dashboardData.recentNews} />
          </div>
        </div>
      </div>

      {/* Performance monitor (Ctrl+Shift+P to toggle) */}
      <PerformanceMonitor />
    </>
  );
}
