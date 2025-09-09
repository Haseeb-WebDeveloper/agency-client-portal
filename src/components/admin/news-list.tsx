// src/components/admin/news-list.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  featuredImage: string | null;
  creator?: {
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  content: string;
}

const NewsList = ({ initialNews }: { initialNews: NewsItem[] }) => {
  const [news, setNews] = useState<NewsItem[]>(initialNews);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the news item "${title}"?`)) {
      try {
        const response = await fetch(`/api/admin/news?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Remove the deleted item from the state
          setNews(news.filter((item) => item.id !== id));
        } else {
          const errorData = await response.json();
          console.error("Failed to delete news item:", errorData.error);
          alert("Failed to delete news item: " + errorData.error);
        }
      } catch (error) {
        console.error("Error deleting news item:", error);
        alert("An unexpected error occurred while deleting the news item.");
      }
    }
  };

  return (
    <ul>
      {news.map((item) => (
        <li
          key={item.id}
          className="border border-primary/20 p-4 rounded-lg mb-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {item.featuredImage && item.featuredImage.trim() !== "" && (
              <div className="md:w-1/3">
                <NextImage
                  src={item.featuredImage}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover w-full h-48 md:h-64"
                />
              </div>
            )}
            <div className={item.featuredImage ? "md:w-2/3" : "w-full"}>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {item.title}
              </h2>
              <p className="text-sm text-foreground/60 mb-4">
                {item.creator?.firstName} {item.creator?.lastName} •{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              <div
                className="prose prose-invert max-w-none text-foreground/80"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/admin/news/edit/${item.id}`}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default NewsList;
