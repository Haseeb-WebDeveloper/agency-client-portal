// src/app/client/news/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SkeletonLoading } from "@/components/shared/skeleton-loading";

// Define the news item type
interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  featuredImage: string | null;
  content: string;
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function ClientNewsPage() {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/client/news");
        if (!response.ok) {
          throw new Error("Failed to load news");
        }
        const data = await response.json();
        setNewsData(data);
      } catch (err) {
        setError("Failed to load news: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="figma-h3">News</h1>
        </div>
        <SkeletonLoading type="list" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="figma-h3">News</h1>
        </div>
        <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">News</h1>
      </div>

      {newsData.length === 0 ? (
        <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg">
          <p className="text-center text-foreground/60">
            No news available at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {newsData.map((newsItem) => (
            <div
              key={newsItem.id}
              className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {newsItem.featuredImage && (
                  <div className="md:w-1/3">
                    <Image
                      src={newsItem.featuredImage}
                      alt={newsItem.title}
                      width={400}
                      height={300}
                      className="rounded-lg object-cover w-full h-48 md:h-64"
                    />
                  </div>
                )}
                <div className={newsItem.featuredImage ? "md:w-2/3" : "w-full"}>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {newsItem.title}
                  </h2>
                  <p className="text-sm text-foreground/60 mb-4">
                    {newsItem.creator?.firstName} {newsItem.creator?.lastName} •{" "}
                    {new Date(newsItem.createdAt).toLocaleDateString()}
                  </p>
                  <div
                    className="prose prose-invert max-w-none text-foreground/80"
                    dangerouslySetInnerHTML={{ __html: newsItem.content }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
