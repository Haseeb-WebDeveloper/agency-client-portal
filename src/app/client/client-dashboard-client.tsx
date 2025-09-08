"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ClientStatsCards } from "@/components/client/client-stats-cards";
import { OngoingContracts } from "@/components/client/ongoing-contracts";
import { MessagesCard } from "@/components/client/messages-card";
import { getGreeting, getGreetingSubtitle } from "@/utils/greeting";

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

          {/* Recent news card - placeholder for now */}
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
              <div className="flex items-start gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-figma-primary to-figma-primary-purple-1 rounded flex items-center justify-center">
                  <span className="text-xs text-figma-text-white">AI</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    Achieve the Impossible with AI
                  </h4>
                  <p className="text-xs text-foreground/60">
                    Lorem ipsum dolor sit amet consectetur...
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-figma-warning to-orange-400 rounded flex items-center justify-center">
                  <span className="text-xs text-figma-text-white">VR</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    Boost your brand with VR services
                  </h4>
                  <p className="text-xs text-foreground/60">
                    Lorem ipsum dolor sit amet consectetur...
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button className="text-sm text-figma-primary hover:text-figma-primary-purple-1 transition-colors">
                  View all news
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
