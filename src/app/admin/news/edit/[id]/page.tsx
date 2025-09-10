// src/app/admin/news/edit/[id]/page.tsx
import React from "react";
import Link from "next/link";
import NewsForm from "../../../../../components/admin/news-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const EditNewsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  // Require admin authentication
  await requireAdmin();
  
  const { id } = await params;

  // If id is "new", we're creating a new news item
  if (id === "new") {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="figma-h3">Create News</h1>
          <Link
          href="/admin/news"
          className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          ← Back
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
      <div className="space-y-12 md:px-8 md:py-6 px-4 py-6">
        <h1 className="figma-h3 mb-4">News item not found</h1>
        <Link
          href="/admin/news"
          className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 md:px-8 md:py-6 px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="figma-h3">Edit News</h1>
        <Link
          href="/admin/news"
          className="px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          ← Back
        </Link>
      </div>
      <NewsForm initialData={newsItem} />
    </div>
  );
};

export default EditNewsPage;
