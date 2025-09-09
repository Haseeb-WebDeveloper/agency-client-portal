// src/app/admin/news/page.tsx
import React from "react";
import Link from "next/link";
import NewsList from "../../../components/admin/news-list";
import { prisma } from "@/lib/prisma";

const AdminNewsPage = async () => {
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
      createdAt: true,
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Transform the data to match the NewsItem interface
  const transformedNews = news.map((item) => ({
    ...item,
    featuredImage: item.featuredImage || null,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="figma-h3">News</h1>
        <Link
          href="/admin/news/edit/new"
          className="px-4 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] rounded-lg text-white rounded hover:bg-blue-600 transition-colors"
        >
          + Create News
        </Link>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-white mb-2">Existing News</h2>
        <NewsList initialNews={transformedNews} />
      </div>
    </div>
  );
};

export default AdminNewsPage;
