// src/app/admin/news/page.tsx
import React, { Suspense } from "react";
import Link from "next/link";
import NewsList from "../../../components/admin/news-list";
import { requireAdmin } from "@/lib/auth";

export const revalidate = 60;

const AdminNewsPage = async () => {
  // Require admin authentication
  await requireAdmin();

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
        <Suspense fallback={<div className="min-h-96 flex items-center justify-center">Loading news...</div>}>
          <NewsList />
        </Suspense>
      </div>
    </div>
  );
}
