"use client";

import { memo, useState, useEffect, useTransition, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { OffersPagination } from "@/components/admin/offers-pagination";
import { ClientOfferCard } from "@/components/client/offer-card";
import { fetchClientData, invalidateClientCache } from "@/lib/client-cache-strategy";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  media: any[] | null;
  validUntil: string | null;
  createdAt: string;
}

interface OffersResponse {
  offers: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Memoized loading skeleton
const LoadingSkeleton = memo(() => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="border border-primary/20 rounded-lg p-6 space-y-4 animate-pulse"
      >
        <div className="h-6 bg-primary/10 rounded w-3/4"></div>
        <div className="h-4 bg-primary/10 rounded w-full"></div>
        <div className="h-4 bg-primary/10 rounded w-2/3"></div>
        <div className="pt-4 flex justify-between">
          <div className="h-8 w-24 bg-primary/10 rounded"></div>
          <div className="h-8 w-24 bg-primary/10 rounded"></div>
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized empty state
const EmptyState = memo(() => (
  <div className="rounded-lg border border-primary/20 p-16 text-center">
    <p className="figma-h4">
      There are no offers <em>yet</em>
    </p>
    <p className="mt-2 text-foreground/60">
      We'll notify you as soon as new offers are available.
    </p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Memoized offers list
const OffersList = memo(({ offers }: { offers: Offer[] }) => (
  <div className="space-y-4">
    {offers.map((offer) => (
      <ClientOfferCard key={offer.id} offer={offer} />
    ))}
  </div>
));

OffersList.displayName = 'OffersList';

export default function OptimizedOffersPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<OffersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  // Memoized fetch function
  const fetchOffers = useCallback(async (
    pageNum: number = page,
    searchTerm: string = search,
    statusFilter: string = status
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ 
        page: pageNum.toString(), 
        limit: "15" 
      });
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("status", statusFilter);

      const cacheKey = `offers_${searchTerm}_${statusFilter}_${pageNum}`;
      
      const response = await fetchClientData<OffersResponse>(
        `/api/client/offers?${params.toString()}`,
        {
          cacheKey,
          ttl: 5 * 60 * 1000, // 5 minutes cache
          revalidate: 180, // 3 minutes server cache
          tags: ['offers']
        }
      );
      
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch offers");
      console.error("Error fetching offers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  // Initial load
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Handle search with transition
  const handleSearch = useCallback((searchTerm: string, statusFilter: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (searchTerm) url.searchParams.set("search", searchTerm);
      else url.searchParams.delete("search");
      if (statusFilter) url.searchParams.set("status", statusFilter);
      else url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
      fetchOffers(1, searchTerm, statusFilter);
    });
  }, [fetchOffers]);

  // Refresh data function
  const refreshData = useCallback(() => {
    invalidateClientCache('offers');
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">Your Offers</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={refreshData}
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            title="Refresh data"
          >
            🔄 Refresh
          </button>
          {/* Add search filters if needed */}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
          {error}
          <button 
            onClick={refreshData}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || isPending) && !data ? <LoadingSkeleton /> : null}

      {/* Empty State */}
      {!isLoading && !isPending && data && data.offers.length === 0 ? (
        <EmptyState />
      ) : null}

      {/* Offers List */}
      {data && data.offers.length > 0 && (
        <>
          <OffersList offers={data.offers} />
          {data?.offers.length > 5 && (
            <OffersPagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              hasNext={data.pagination.hasNext}
              hasPrev={data.pagination.hasPrev}
              total={data.pagination.total}
              limit={data.pagination.limit}
            />
          )}
        </>
      )}
    </div>
  );
}
