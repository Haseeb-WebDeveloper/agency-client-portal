"use client";

import { useEffect, useState, useTransition } from "react";
import { ContractsSearchFilters } from "@/components/admin/contracts-search-filters";
import { ContractsPagination } from "@/components/admin/contracts-pagination";
import { ClientContractCard } from "@/components/client/contract-card";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  progressPercentage: number;
  mediaFilesCount: number;
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

export default function ClientContractsPage() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<ContractsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async (page: number, search = "", status = "") => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/client/contracts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch contracts");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch contracts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const page = parseInt(url.searchParams.get("page") || "1");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    fetchContracts(page, search, status);
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
      fetchContracts(1, search, status);
    });
  };

  return (
    <div className="space-y-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="figma-h3">Your Contracts</h1>
        <ContractsSearchFilters
          onSearch={handleSearch}
          isLoading={isLoading || isPending}
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      {isLoading && !data ? (
        <div className="h-40 flex items-center justify-center text-foreground/60">
          Loading...
        </div>
      ) : data && data.contracts.length === 0 ? (
        <div className="rounded-lg border border-primary/20 bg-card p-16 text-center">
          <p className="figma-h4">
            There is nothing here to show <em>yet</em>
          </p>
          <p className="mt-2 text-foreground/60">
            As soon as Figmenta sets up your agreements, you'll be able to view,
            download, and manage them in this space.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {data?.contracts.map((c) => (
              <ClientContractCard key={c.id} contract={c} />
            ))}
          </div>
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
