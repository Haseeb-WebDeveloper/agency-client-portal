"use client";

import { useState, useEffect } from "react";
import { OngoingContracts } from "@/components/client/ongoing-contracts";
import { MessagesCard } from "@/components/client/messages-card";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";
import Link from "next/link";
import Image from "next/image";
import { ClientStatsCards } from "@/components/client/client-stats-cards";
import { SkeletonLoading } from "@/components/shared/skeleton-loading";
import {
  getClientDashboardStats,
  getClientRecentNews,
} from "@/lib/cached-client";
import { requireClient } from "@/lib/auth";
import OptimizedClientDashboard from "@/components/client/optimized-client-dashboard";
export default function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard data
        const dashboardResponse = await fetch("/api/client/dashboard");
        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const dashboardResult = await dashboardResponse.json();

        // Fetch user data
        const userResponse = await fetch("/api/client/user");
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userResult = await userResponse.json();

        setDashboardData(dashboardResult);
        setUser(userResult);
      } catch (err) {
        setError("Failed to load dashboard: " + (err as Error).message);
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    return <OptimizedClientDashboard serializedData={serializedData} />;
  } catch (error) {
    console.error("Error loading client dashboard:", error);
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-500">
          Error loading dashboard
        </h2>
        <p className="text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary rounded hover:bg-primary/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-500">
          Error loading dashboard
        </h2>
        <p className="text-red-300">Missing required data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-6">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="figma-h3">{getGreeting(user.firstName)}</h1>
          <p className="mt-1">{getGreetingSubtitle()}</p>
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
          <MessagesCard messages={dashboardData.recentMessages} />

          {/* Recent news card - styled like admin */}
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
              {(!dashboardData.recentNews ||
                dashboardData.recentNews.length === 0) && (
                <div className="px-5 py-4 text-sm text-foreground/60">
                  No news posted yet.
                </div>
              )}
              {dashboardData.recentNews &&
                dashboardData.recentNews
                  .slice(0, 2)
                  .map((newsItem: any, idx: number) => (
                    <Link
                      key={newsItem.id}
                      href={`/client/news/${newsItem.id}`}
                      className={`flex items-center px-5 py-4 ${
                        idx !== dashboardData.recentNews.slice(0, 2).length - 1
                          ? "border-b border-primary/20"
                          : ""
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
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-14 bg-gradient-to-r from-primary to-primary/20 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-foreground">
                            Featured
                          </span>
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
        </div>
      </div>
    </div>
  );
}
