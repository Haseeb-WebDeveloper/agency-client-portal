"use client";

import { useState, useEffect } from "react";
import { MessageCache } from "@/lib/message-cache";

export default function PerformanceMonitor() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalMessages: 0,
    memoryUsage: "0 KB",
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = MessageCache.getStats();
      setStats(cacheStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Show/hide with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-primary/20 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-foreground/60 hover:text-foreground"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">Cached Rooms:</span>
          <span className="font-mono">{stats.totalRooms}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">Cached Messages:</span>
          <span className="font-mono">{stats.totalMessages}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">Memory Usage:</span>
          <span className="font-mono">{stats.memoryUsage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">Performance:</span>
          <span className="text-green-500 font-medium">⚡ Blazing Fast</span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-primary/10">
        <button
          onClick={() => {
            MessageCache.clear();
            setStats({ totalRooms: 0, totalMessages: 0, memoryUsage: "0 KB" });
          }}
          className="text-xs text-destructive hover:text-destructive/80"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}
