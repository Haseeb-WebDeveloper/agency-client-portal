"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Create a timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Reduced timeout to 1 second

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Show loading indicator when route changes
    setIsLoading(true);

    // Hide loading indicator after a short delay for better perceived performance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150); // Reduced from 300ms to 150ms for better perceived performance

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-foreground/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}
