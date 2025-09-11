import {
  getClientDashboardStats,
  getClientRecentNews,
} from "@/lib/cached-client";
import { requireClient } from "@/lib/auth";
import OptimizedClientDashboard from "@/components/client/optimized-client-dashboard";

// src/app/client/page.tsx

export default async function ClientDashboard() {
  try {
    // Get current user (server-side) - enforce client role
    const user = await requireClient();

    // Get dashboard data (server-side)
    const dashboardData = await getClientDashboardStats(user.id);

    // Fetch news data using the proper service function
    const newsData = await getClientRecentNews(5);

    // Serialize data for client component
    const serializedData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
      },
      dashboardData: {
        contracts: dashboardData.contracts,
        offers: dashboardData.offers,
        ongoingContracts: dashboardData.ongoingContracts.map((contract) => ({
          id: contract.id,
          title: contract.title,
          status: contract.status,
          total_tasks: contract.total_tasks,
          completed_tasks: contract.completed_tasks,
        })),
        recentMessages: dashboardData.recentMessages.map((message) => ({
          id: message.id,
          content: message.content,
          createdAt:
            message.createdAt instanceof Date
              ? message.createdAt.toISOString()
              : message.createdAt,
          user: {
            id: message.user.id,
            firstName: message.user.firstName,
            lastName: message.user.lastName,
            avatar: message.user.avatar,
          },
          room: message.room,
        })),
        recentNews: newsData.map((newsItem) => ({
          // Serialize news data
          id: newsItem.id,
          title: newsItem.title,
          description: newsItem.description || "", // Handle null description
          featuredImage: newsItem.featuredImage, // Add featured image
        })),
      },
    };

    return <OptimizedClientDashboard serializedData={serializedData} />;
  } catch (error) {
    console.error("Error loading client dashboard:", error);
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-500">
          Error loading dashboard
        </h2>
        <p className="text-red-300">
          Please try refreshing the page or contact support.
        </p>
      </div>
    );
  }
}
