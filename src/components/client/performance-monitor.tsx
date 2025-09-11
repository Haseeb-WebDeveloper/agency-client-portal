"use client";

import { memo, useState, useEffect } from "react";
import { ClientCache } from "@/lib/client-cache-strategy";

interface PerformanceStats {
  totalEntries: number;
  memoryUsage: string;
  hitRate: number;
  lastUpdated: string;
}

export const ClientPerformanceMonitor = memo(() => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalEntries: 0,
    memoryUsage: '0 KB',
    hitRate: 0,
    lastUpdated: new Date().toLocaleTimeString()
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const updateStats = () => {
        const cacheStats = ClientCache.getStats();
        setStats({
          ...cacheStats,
          lastUpdated: new Date().toLocaleTimeString()
        });
      };

      updateStats();
      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const clearCache = () => {
    ClientCache.clear();
    setStats(prev => ({
      ...prev,
      totalEntries: 0,
      memoryUsage: '0 KB',
      lastUpdated: new Date().toLocaleTimeString()
    }));
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 bg-black/95 text-white rounded-lg z-50 transition-all duration-300 ${
      isMinimized ? 'w-12 h-12' : 'w-80 p-4'
    }`}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center text-lg"
          title="Open Performance Monitor"
        >
          📊
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Client Performance Monitor</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
                title="Minimize"
              >
                −
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-700"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Cache Entries:</span>
              <span className="font-mono">{stats.totalEntries}</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="font-mono">{stats.memoryUsage}</span>
            </div>
            <div className="flex justify-between">
              <span>Hit Rate:</span>
              <span className="font-mono">{stats.hitRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span className="font-mono text-xs">{stats.lastUpdated}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCache}
              className="flex-1 px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700 transition-colors"
            >
              Clear Cache
            </button>
            <button
              onClick={() => {
                const newStats = ClientCache.getStats();
                setStats({
                  ...newStats,
                  lastUpdated: new Date().toLocaleTimeString()
                });
              }}
              className="flex-1 px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="text-xs text-gray-400 text-center">
            Press Ctrl+Shift+P to toggle
          </div>
        </div>
      )}
    </div>
  );
});

ClientPerformanceMonitor.displayName = 'ClientPerformanceMonitor';
