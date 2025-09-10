"use client";

import { useEffect, useState, useTransition } from "react";
import { ContractsSearchFilters } from "@/components/admin/contracts-search-filters";
import { OffersPagination } from "@/components/admin/offers-pagination";
import { ClientOfferCard } from "@/components/client/offer-card";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
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

export default function ClientOffersPage() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<OffersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async (page: number, search = "", status = "") => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/client/offers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch offers");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch offers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const page = parseInt(url.searchParams.get("page") || "1");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    fetchOffers(page, search, status);
  }, []);

  const handleSearch = (search: string, status: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      if (search) url.searchParams.set("search", search);
      else url.searchParams.delete("search");
      if (status) url.searchParams.set("status", status);
      else url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
      fetchOffers(1, search, status);
    });
  };

  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">Your Offers</h1>
        {/* Reuse contracts filters with status list typed in UI copy */}
        <ContractsSearchFilters
          onSearch={handleSearch}
          isLoading={isLoading || isPending}
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      {/* Loading State */}
      {(isLoading || isPending) && !data ? (
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
      ) : null}

      {/* Empty State */}
      {!isLoading && !isPending && data && data.offers.length === 0 ? (
        <div className="rounded-lg border border-primary/20 p-16 text-center">
          <p className="figma-h4">
            There are no offers <em>yet</em>
          </p>
          <p className="mt-2 text-foreground/60">
            We'll notify you as soon as new offers are available.
          </p>
        </div>
      ) : null}

      {/* Offers List */}
      {data && data.offers.length > 0 && (
        <>
          <div className="space-y-4">
            {data?.offers.map((o) => (
              <ClientOfferCard key={o.id} offer={o} />
            ))}
          </div>
          {data && (
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
