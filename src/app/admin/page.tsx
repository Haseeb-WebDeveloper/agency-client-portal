"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminDashboardStats, getRecentNews } from "@/lib/cached-admin";
import { requireAdmin } from "@/lib/auth";
import { StatsCards } from "@/components/admin/stats-cards";
import { ClientsTable } from "@/components/admin/clients-table";
import { MessagesCard } from "@/components/admin/messages-card";
import { QuickActions } from "@/components/admin/quick-actions";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";
import Image from "next/image";
import { SkeletonLoading } from "@/components/shared/skeleton-loading";

export const revalidate = 300; // 5 minutes

export default async function AdminDashboard() {
  // Require admin authentication
  const user = await requireAdmin();

  const [dashboardData, newsData] = await Promise.all([
    getAdminDashboardStats(),
    getRecentNews(5),
  ]);

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
          <Suspense fallback={<div className="min-h-24" />}> 
            {/* stats are already awaited above, Suspense is a safe guard for future streaming splits */}
            <StatsCards
              contracts={dashboardData.contracts}
              offers={dashboardData.offers}
            />
          </Suspense>

          {/* Clients table */}
          <Suspense fallback={<div className="min-h-40" />}> 
            <ClientsTable clients={dashboardData.clients} />
          </Suspense>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Messages card */}
          <Suspense fallback={<div className="min-h-24" />}> 
            <MessagesCard />
          </Suspense>

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
