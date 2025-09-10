"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Create a timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds max loading time

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Show loading indicator when route changes
    setIsLoading(true);

    // Hide loading indicator after a short delay
    // In a real app, you might want to use router events instead
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Reduced from 500ms to 300ms for better perceived performance

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-foreground/60">Loading...</p>
      </div>
    </div>
  );
}
