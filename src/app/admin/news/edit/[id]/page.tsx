// src/app/admin/news/edit/[id]/page.tsx
import React from "react";
import Link from "next/link";
import NewsForm from "../../../../../components/admin/news-form";
import { prisma } from "@/lib/prisma";

const EditNewsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  // If id is "new", we're creating a new news item
  if (id === "new") {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="figma-h3">Create News</h1>
          <Link
            href="/admin/news"
            className="px-4 py-2 border border:primary/20 rounded-lg text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </Link>
        </div>
        <NewsForm />
      </div>
    );
  }

  // Otherwise, we're editing an existing news item
  const newsItem = await prisma.news.findUnique({
    where: { id },
  });

  if (!newsItem) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          News item not found
        </h1>
        <Link
          href="/admin/news"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to News
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Edit News</h1>
        <Link
          href="/admin/news"
          className="px-4 py-2 border border:primary/20 rounded-lg text-white rounded hover:bg-gray-600 transition-colors"
        >
          Cancel
        </Link>
      </div>
      <NewsForm initialData={newsItem} />
    </div>
  );
};

export default EditNewsPage;
