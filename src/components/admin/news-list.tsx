"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, Users, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";

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
  sendTo: string[];
  sendToAll: boolean;
}

interface NewsResponse {
  items: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const NewsList = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [hasMore, setHasMore] = useState(true);
  
  const debouncedSearch = useDebounce(search, 300);

  const fetchNews = useCallback(async (pageNum: number = 1, searchTerm: string = "", reset: boolean = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await fetch(`/api/admin/news?${params}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      
      const data: NewsResponse = await response.json();
      
      if (reset) {
        setNews(data.items);
      } else {
        setNews(prev => [...prev, ...data.items]);
      }
      
      setPagination(data.pagination);
      setHasMore(data.pagination.hasNext);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNews(1, debouncedSearch, true);
  }, [debouncedSearch, fetchNews]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = pagination.page + 1;
      setPage(nextPage);
      fetchNews(nextPage, debouncedSearch, false);
    }
  }, [loading, hasMore, pagination.page, debouncedSearch, fetchNews]);

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the news item "${title}"?`)) {
      try {
        const response = await fetch(`/api/admin/news?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Remove the deleted item from the state
          setNews(prev => prev.filter((item) => item.id !== id));
          // Refresh the list to get updated pagination
          fetchNews(1, debouncedSearch, true);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";
    return `${day}${suffix} ${month}, ${year}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2 border border-primary/20 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* News Grid */}
      <div className="grid gap-6">
        {news.map((item) => (
        <div key={item.id} className="relative">
          {/* Status Indicator */}
          <div className="absolute -top-[26px] right-0 z-10">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-medium border border-b-0 bg-green-500 shadow-sm`}
              style={{
                background: "#18102B",
              }}
            >
              <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
              <span>Active</span>
            </div>
          </div>

          <Link
            href={`/admin/news/edit/${item.id}`}
            className="block rounded-xl overflow-hidden border border-primary/20 transition-all duration-300 group"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Image Section */}
              {item.featuredImage && item.featuredImage.trim() !== "" && (
                <div className="lg:w-1/3 relative">
                  <Image
                    src={item.featuredImage}
                    alt={item.title}
                    width={400}
                    height={300}
                    className="object-cover w-full h-48 lg:h-64"
                  />
                  {/* Overlay gradient for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}

              {/* Content Section */}
              <div
                className={`${
                  item.featuredImage ? "lg:w-2/3" : "w-full"
                } p-6 `}
              >
                <h2 className="text-2xl font-bold  mb-3 transition-colors">
                  {item.title}
                </h2>

                <p className="figma-paragraph mb-4 line-clamp-2">
                  {item.description ||
                    "Leverage our AI services and be in the top 1%. Lorem ipsum dolor sit amet..."}
                </p>

                {/* Shared Clients Section */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-foreground/10 border border-primary/20 flex items-center justify-center text-xs font-medium">
                      {item.creator ? getInitials(item.creator.firstName, item.creator.lastName) : "AC"}
                    </div>
                    {item.sendToAll && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-white/20 flex items-center justify-center text-xs font-medium">
                        ALL
                      </div>
                    )}
                  </div>

                  <div className="text-foreground/70 text-sm">
                    <Users className="w-4 h-4 inline mr-1" />
                    {item.sendToAll ? "Shared with all clients" : `Shared with ${item.sendTo.length} specific clients`}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center /60 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          </Link>
        </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading news...</span>
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {/* No Results */}
      {!loading && news.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">No news found</p>
        </div>
      )}

      {/* Pagination Info */}
      {!loading && news.length > 0 && (
        <div className="text-center text-sm text-foreground/60 py-4">
          Showing {news.length} of {pagination.total} news items
        </div>
      )}
    </div>
  );
};

export default NewsList;
