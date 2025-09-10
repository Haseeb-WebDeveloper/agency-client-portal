import NextImage from "next/image";
import Link from "next/link";
import { getAdminDashboardStats, getRecentNews } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";
import { StatsCards } from "@/components/admin/stats-cards";
import { ClientsTable } from "@/components/admin/clients-table";
import { MessagesCard } from "@/components/admin/messages-card";
import { QuickActions } from "@/components/admin/quick-actions";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";

// src/app/admin/page.tsx

export default async function AdminDashboard() {
  // Require admin authentication
  const user = await requireAdmin();

  // Get dashboard data
  const dashboardData = await getAdminDashboardStats();

  // Fetch news data
  const newsData = await getRecentNews(5);


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

          {/* Recent news card */}
          <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-6">
            <div className="flex items-center gap-3">
              <NextImage
                src="/icons/news.svg"
                alt="Recent News"
                width={20}
                height={20}
              />
              <p className="figma-paragraph text-foreground">
                Recent News Posted
              </p>
            </div>
            <div className="space-y-4">
              {newsData.map((newsItem) => (
                <div className="flex items-start gap-3" key={newsItem.id}>
                  {newsItem.featuredImage ? (
                    <div className="flex-shrink-0">
                      <NextImage
                        src={newsItem.featuredImage}
                        alt={newsItem.title}
                        width={48}
                        height={48}
                        className="rounded object-cover w-12 h-12"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-figma-primary to-figma-primary-purple-1 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-figma-text-white">ai</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {newsItem.title}
                    </h4>
                    <p className="text-xs text-foreground/60">
                      {newsItem.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/admin/news"
                  className="text-sm text-figma-primary hover:text-figma-primary-purple-1 transition-colors"
                >
                  View all news
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
