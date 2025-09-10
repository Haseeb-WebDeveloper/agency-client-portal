// src/app/admin/news/page.tsx
import React from "react";
import Link from "next/link";
import NewsList from "../../../components/admin/news-list";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const AdminNewsPage = async () => {
  // Require admin authentication
  await requireAdmin();
  const news = await prisma.news.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      featuredImage: true,
      content: true,
      sendTo: true,
      sendToAll: true,
      createdAt: true,
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Get client information for sendTo users
  const sendToUserIds = [...new Set(news.flatMap(item => item.sendTo))];
  const clients = await prisma.client.findMany({
    where: {
      memberships: {
        some: {
          userId: { in: sendToUserIds },
          isActive: true,
        },
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      logo: true,
      memberships: {
        where: {
          userId: { in: sendToUserIds },
          isActive: true,
        },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  // Create a map of userId to client info
  const userToClientMap = new Map();
  clients.forEach(client => {
    client.memberships.forEach(membership => {
      userToClientMap.set(membership.userId, {
        clientId: client.id,
        clientName: client.name,
        clientLogo: client.logo,
        user: membership.user,
      });
    });
  });

  // Transform the data to match the NewsItem interface
  const transformedNews = news.map((item) => ({
    ...item,
    featuredImage: item.featuredImage || null,
    createdAt: item.createdAt.toISOString(),
    sharedClients: item.sendToAll 
      ? [{ clientName: "All Clients", clientLogo: null, user: null }]
      : item.sendTo.map(userId => userToClientMap.get(userId)).filter(Boolean),
  }));

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
        <NewsList initialNews={transformedNews} />
      </div>
    </div>
  );
};

export default AdminNewsPage;
