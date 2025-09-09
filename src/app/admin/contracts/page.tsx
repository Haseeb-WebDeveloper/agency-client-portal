'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ContractCard } from '@/components/admin/contract-card';
import { ContractsSearchFilters } from '@/components/admin/contracts-search-filters';
import { ContractsPagination } from '@/components/admin/contracts-pagination';

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  progressPercentage: number;
  mediaFilesCount: number;
  createdAt: string;
  client_name: string;
  client_logo: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

interface ContractsData {
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

function ContractsContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [contractsData, setContractsData] = useState<ContractsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const fetchContracts = async (searchTerm: string = search, statusFilter: string = status, pageNum: number = page) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/contracts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      const data = await response.json();
      setContractsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, search, status]);

  const handleSearch = (searchTerm: string, statusFilter: string) => {
    startTransition(() => {
      fetchContracts(searchTerm, statusFilter, 1);
    });
  };

  if (isLoading && !contractsData) {
    return (
      <div className="space-y-6  px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="figma-h3">Contracts</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6  px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="figma-h3">Contracts</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Contracts</h3>
            <p className="text-foreground/60 mb-4">{error}</p>
            <button
              onClick={() => fetchContracts()}
              className="figma-btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-16  px-8 py-6">
        {/* Header with Search and Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="figma-h3">Contracts</h1>
          </div>
          <div className="flex items-center gap-3">
            <ContractsSearchFilters 
              onSearch={handleSearch}
              isLoading={isLoading || isPending}
            />
            <button
              onClick={() => window.location.href = '/admin/contracts/new'}
              className="cursor-pointer bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] px-6 py-2 rounded-lg transition-all"
            >
              Create Contract
            </button>
          </div>
        </div>

        {/* Contracts Grid */}
        {contractsData && contractsData.contracts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contractsData.contracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>

            {/* Pagination */}
           {
            contractsData.pagination.totalPages > 1 && (
              <ContractsPagination
                currentPage={contractsData.pagination.page}
                totalPages={contractsData.pagination.totalPages}
                hasNext={contractsData.pagination.hasNext}
                hasPrev={contractsData.pagination.hasPrev}
                total={contractsData.pagination.total}
                limit={contractsData.pagination.limit}
              />
            )
           }
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Contracts Found</h3>
              <p className="text-foreground/90 mb-4">
                {search || status 
                  ? 'No contracts match your search criteria. Try adjusting your filters.'
                  : 'You don\'t have any contracts yet. Start by creating your first contract.'
                }
              </p>
              {(search || status) && (
                <button
                  onClick={() => handleSearch('', '')}
                  className="figma-btn-secondary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6  px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="figma-h3">Contracts</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        </div>
      </div>
    }>
      <ContractsContent />
    </Suspense>
  );
}
