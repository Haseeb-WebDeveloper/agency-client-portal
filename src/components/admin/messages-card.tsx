"use client";

import { useState, useEffect } from "react";
import { MessagesCardShared } from "@/components/shared/messages-card";

export function MessagesCard() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/messages/rooms");
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const data = await response.json();
        console.log("API Response:", data); // Log the entire API response
        setRooms(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load messages");
        console.error("Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div
        className="bg-transparent border border-primary/20 rounded-xl p-0 shadow-md"
        style={{ minWidth: 320 }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="h-6 bg-primary/10 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-4 p-5">
          <div className="h-16 bg-primary/10 rounded animate-pulse"></div>
          <div className="h-16 bg-primary/10 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-transparent border border-primary/20 rounded-xl p-5 shadow-md"
        style={{ minWidth: 320 }}
      >
        <p className="text-red-500">Error loading messages: {error}</p>
      </div>
    );
  }

  // Calculate total unseen messages across all rooms
  const totalUnseen = rooms.reduce((sum: number, r: any) => {
    const unseen = typeof r.unseenCount === 'number' ? r.unseenCount : 0;
    console.log(`Room ${r.id} Unseen Count:`, unseen); // Log each room's unseen count
    return sum + unseen;
  }, 0);

  const items = rooms.map((r: any) => ({
    id: r.id,
    title: r.name,
    subtitle: r.latestMessage?.content || "No messages yet",
    avatarUrl: r.logo || null,
    avatarFallback: r.name.slice(0, 2).toUpperCase(),
    href: `/messages?roomId=${r.id}`,
  }));

  return <MessagesCardShared items={items} totalUnseen={totalUnseen} />;
}