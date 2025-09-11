// src/app/admin/news/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NewsList from "../../../components/admin/news-list";
import { SkeletonLoading } from "@/components/shared/skeleton-loading";

export default function AdminNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/news?all=true");
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        const { news: newsData, clients: clientsData } = await response.json();

        // Create a map of userId to client info
        const userToClientMap = new Map();
        clientsData.forEach((client: any) => {
          client.memberships.forEach((membership: any) => {
            userToClientMap.set(membership.userId, {
              clientId: client.id,
              clientName: client.name,
              clientLogo: client.logo,
              user: membership.user,
            });
          });
        });

        // Transform the data to match the NewsItem interface
        const transformedNews = newsData.map((item: any) => ({
          ...item,
          featuredImage: item.featuredImage || null,
          createdAt:
            typeof item.createdAt === "string"
              ? item.createdAt
              : item.createdAt.toISOString(),
          sharedClients: item.sendToAll
            ? [{ clientName: "All Clients", clientLogo: null, user: null }]
            : item.sendTo
                .map((userId: string) => userToClientMap.get(userId))
                .filter(Boolean),
        }));

        setNews(transformedNews);
        setClients(clientsData);
      } catch (err) {
        setError("Failed to load news: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-12 md:px-8 md:py-6 px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="figma-h3">Client News posts</h1>
          <Link
            href="/admin/news/edit/new"
            className="w-full md:w-fit cursor-pointer bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] px-6 py-2 rounded-lg transition-all"
          >
            Create News
          </Link>
        </div>
        <div className="mt-6">
          <SkeletonLoading type="list" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-12 md:px-8 md:py-6 px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="figma-h3">Client News posts</h1>
          <Link
            href="/admin/news/edit/new"
            className="w-full md:w-fit cursor-pointer bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] px-6 py-2 rounded-lg transition-all"
          >
            Create News
          </Link>
        </div>
        <div className="mt-6">
          <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 md:px-8 md:py-6 px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="figma-h3">Client News posts</h1>
        <Link
          href="/admin/news/edit/new"
          className="w-full md:w-fit cursor-pointer bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] px-6 py-2 rounded-lg transition-all"
        >
          Create News
        </Link>
      </div>

      <div className="mt-6">
        <NewsList initialNews={news} />
      </div>
    </div>
  );
}
