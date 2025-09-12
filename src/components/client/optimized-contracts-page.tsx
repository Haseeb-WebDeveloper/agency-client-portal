"use client";

import { memo, useState, useEffect, useTransition, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ContractsSearchFilters } from "@/components/admin/contracts-search-filters";
import { ContractsPagination } from "@/components/admin/contracts-pagination";
import { ClientContractCard } from "@/components/client/contract-card";
import { fetchClientData, invalidateClientCache } from "@/lib/client-cache-strategy";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  progressPercentage: number;
  mediaFilesCount: number;
  media: any[] | null;
  hasReviewed: boolean;
  rooms: any[];
  createdAt: string;
}

interface ContractsResponse {
  contracts: Contract[];
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
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="border border-primary/20 rounded-lg p-6 space-y-4 animate-pulse"
      >
        <div className="h-6 bg-primary/10 rounded w-3/4"></div>
        <div className="h-4 bg-primary/10 rounded w-full"></div>
        <div className="h-4 bg-primary/10 rounded w-2/3"></div>
        <div className="pt-4">
          <div className="h-2 bg-primary/10 rounded w-full"></div>
        </div>
        <div className="flex justify-between pt-4">
          <div className="h-8 w-20 bg-primary/10 rounded"></div>
          <div className="h-8 w-20 bg-primary/10 rounded"></div>
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized empty state
const EmptyState = memo(() => (
  <div className=" p-16 text-center">
    <p className="text-2xl">
      There is nothing here to show <em>yet</em>
    </p>
    <p className="mt-2 text-foreground/80 max-w-2xl mx-auto">
      As soon as Figmenta sets up your agreements, you'll be able to view,
      download, and manage them in this space.
    </p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Memoized contract grid
const ContractGrid = memo(({ contracts }: { contracts: Contract[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {contracts.map((contract) => (
      <ClientContractCard key={contract.id} contract={contract} />
    ))}
  </div>
));

ContractGrid.displayName = 'ContractGrid';

export default function OptimizedContractsPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<ContractsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  // Memoized fetch function
  const fetchContracts = useCallback(async (
    pageNum: number = page,
    searchTerm: string = search,
    statusFilter: string = status
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ 
        page: pageNum.toString(), 
        limit: "9" 
      });
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("status", statusFilter);

      const cacheKey = `contracts_${searchTerm}_${statusFilter}_${pageNum}`;
      
      const response = await fetchClientData<ContractsResponse>(
        `/api/client/contracts?${params.toString()}`,
        {
          cacheKey,
          ttl: 5 * 60 * 1000, // 5 minutes cache
          revalidate: 180, // 3 minutes server cache
          tags: ['contracts']
        }
      );
      
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contracts");
      console.error("Error fetching contracts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  // Initial load
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

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
      fetchContracts(1, searchTerm, statusFilter);
    });
  }, [fetchContracts]);

  // Refresh data function
  const refreshData = useCallback(() => {
    invalidateClientCache('contracts');
    fetchContracts();
  }, [fetchContracts]);

  return (
    <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">Your Contracts</h1>
        <div className="flex items-center gap-4">
          {/* <button
            onClick={refreshData}
            className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            title="Refresh data"
          >
            🔄 Refresh
          </button> */}
          <ContractsSearchFilters
            onSearch={handleSearch}
            isLoading={isLoading || isPending}
          />
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
      {!isLoading && !isPending && data && data.contracts.length === 0 ? (
        <EmptyState />
      ) : null}

      {/* Contracts Grid */}
      {data && data.contracts.length > 0 && (
        <>
          <ContractGrid contracts={data.contracts} />
          {data && (
            <ContractsPagination
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
