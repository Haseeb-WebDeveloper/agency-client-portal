"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import Image from "next/image";

interface SharedClient {
  clientId: string;
  clientName: string;
  clientLogo: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
}

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
  sharedClients: SharedClient[];
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
    <div className="grid gap-6 mt-16">
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
                className={`${item.featuredImage ? "lg:w-2/3" : "w-full"} p-6 `}
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
                    {item.sharedClients.slice(0, 4).map((client, index) => (
                      <div key={index} className="relative">
                        {client.user?.avatar ? (
                          <Image
                            src={client.user.avatar}
                            alt={`${client.user.firstName} ${client.user.lastName}`}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full border-2 border-white/20 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-foreground/10 border border-primary/20 flex items-center justify-center  text-xs font-medium">
                            {client.user
                              ? getInitials(
                                  client.user.firstName,
                                  client.user.lastName
                                )
                              : "AC"}
                          </div>
                        )}
                      </div>
                    ))}
                    {item.sharedClients.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-white/20 flex items-center justify-center  text-xs font-medium">
                        +{item.sharedClients.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="/70 text-sm">
                    <Users className="w-4 h-4 inline mr-1" />
                    Shared across{" "}
                    {item.sendToAll
                      ? "all clients"
                      : `${item.sharedClients.length} accounts`}
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
  );
};

export default NewsList;
