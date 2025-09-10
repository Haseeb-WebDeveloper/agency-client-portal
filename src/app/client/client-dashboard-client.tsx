"use client";

import { OngoingContracts } from "@/components/client/ongoing-contracts";
import { MessagesCard } from "@/components/client/messages-card";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";
import Link from "next/link";
import Image from "next/image";
import { ClientStatsCards } from "@/components/client/client-stats-cards";

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

export default function ClientDashboardClient({
  serializedData,
}: {
  serializedData: SerializedData;
}) {
  const { user, dashboardData } = serializedData;

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
              {dashboardData.recentNews.length === 0 && (
                <div className="px-5 py-4 text-sm text-foreground/60">
                  No news posted yet.
                </div>
              )}
              {dashboardData.recentNews.slice(0, 2).map((newsItem, idx) => (
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
