"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Create a timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setShowLoading(false);
    }, 2000); // 2 seconds max loading time

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Show loading indicator when route changes, but with a delay
    setIsLoading(true);
    
    // Only show the loading overlay after a short delay to avoid flickering
    const showTimer = setTimeout(() => {
      if (isLoading) {
        setShowLoading(true);
      }
    }, 150);

    // Hide loading indicator after a short delay
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
      setShowLoading(false);
    }, 300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname, searchParams, isLoading]);

  if (!showLoading) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-foreground/80">Loading...</p>
    </div>
  );
}
