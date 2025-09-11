"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatsCards } from "@/components/admin/stats-cards";
import { ClientsTable } from "@/components/admin/clients-table";
import { MessagesCard } from "@/components/admin/messages-card";
import { QuickActions } from "@/components/admin/quick-actions";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";
import Image from "next/image";
import { SkeletonLoading } from "@/components/shared/skeleton-loading";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data
        const dashboardResponse = await fetch("/api/admin/dashboard", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Dashboard response status:", dashboardResponse.status);
        console.log("Dashboard response headers:", [
          ...dashboardResponse.headers.entries(),
        ]);

        if (!dashboardResponse.ok) {
          const errorText = await dashboardResponse.text();
          console.log("Dashboard error response:", errorText);
          throw new Error(
            `Failed to fetch dashboard data: ${dashboardResponse.status} ${dashboardResponse.statusText} - ${errorText}`
          );
        }
        const dashboardResult = await dashboardResponse.json();

        // Fetch news data
        const newsResponse = await fetch("/api/admin/news?limit=5", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("News response status:", newsResponse.status);

        if (!newsResponse.ok) {
          const errorText = await newsResponse.text();
          console.log("News error response:", errorText);
          throw new Error(
            `Failed to fetch news data: ${newsResponse.status} ${newsResponse.statusText} - ${errorText}`
          );
        }
        const newsResult = await newsResponse.json();

        // Fetch user data
        const userResponse = await fetch("/api/admin/user", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("User response status:", userResponse.status);

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.log("User error response:", errorText);
          throw new Error(
            `Failed to fetch user data: ${userResponse.status} ${userResponse.statusText} - ${errorText}`
          );
        }
        const userResult = await userResponse.json();

        setDashboardData(dashboardResult);
        setNewsData(newsResult.items || []);
        setUser(userResult);
      } catch (err) {
        const errorMessage = (err as Error).message || "Unknown error occurred";
        setError("Failed to load dashboard: " + errorMessage);
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
        {/* Header with greeting and quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 bg-primary/10 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-primary/10 rounded w-48 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 bg-primary/10 rounded w-32 animate-pulse"></div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-24 bg-primary/10 rounded-lg animate-pulse"></div>
              <div className="h-24 bg-primary/10 rounded-lg animate-pulse"></div>
            </div>

            {/* Clients table */}
            <SkeletonLoading type="table" />
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Messages card */}
            <div className="h-64 bg-primary/10 rounded-lg animate-pulse"></div>

            {/* Recent news card */}
            <div className="h-64 bg-primary/10 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      {/* Header with greeting and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="figma-h3">{getGreeting(user.firstName)}</h1>
          <p className="mt-1">{getGreetingSubtitle()}</p>
        </div>
        <QuickActions />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats cards */}
          <StatsCards
            contracts={dashboardData.contracts}
            offers={dashboardData.offers}
          />

          {/* Clients table */}
          <ClientsTable clients={dashboardData.clients} />
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Messages card */}
          <MessagesCard />

          {/* Recent news card - Redesigned */}
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
              {newsData.length === 0 && (
                <div className="px-5 py-4 text-sm text-foreground/60">
                  No news posted yet.
                </div>
              )}
              {newsData.slice(0, 2).map((newsItem: any, idx: number) => (
                <Link
                  key={newsItem.id}
                  href={`/admin/news/edit/${newsItem.id}`}
                  className={`flex items-center px-5 py-4 ${
                    idx !== newsData.slice(0, 2).length - 1
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
                      <span className="text-xs text-foreground">Featured</span>
                    </div>
                  )}
                  {/* Title*/}
                  <div className="ml-4 flex-1">
                    <div className="text-base font-medium leading-tight text-foreground">
                      {newsItem.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Footer link */}
            <div className="px-5 py-3 border-t border-primary/20">
              <Link
                href="/admin/news"
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
