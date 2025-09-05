'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { OfferCard } from '@/components/admin/offer-card';
import { OffersSearchFilters } from '@/components/admin/offers-search-filters';
import { OffersPagination } from '@/components/admin/offers-pagination';
import { MediaFile } from '@/types/models';

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  media: MediaFile[] | null;
  validUntil: string | null;
  createdAt: string;
  client_name: string;
  client_logo: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

interface OffersData {
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

function OffersContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [offersData, setOffersData] = useState<OffersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null>(null);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const fetchOffers = async (searchTerm: string = search, statusFilter: string = status, pageNum: number = page) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '30',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/offers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }

      const data = await response.json();
      setOffersData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching offers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Get user data
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser({
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: userData.avatar,
          });
        } else {
          // Redirect to login if unauthorized
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Error getting user:', err);
        window.location.href = '/login';
      }
    };
    
    getUser();
    fetchOffers();
  }, [page, search, status]);

  const handleSearch = (searchTerm: string, statusFilter: string) => {
    startTransition(() => {
      fetchOffers(searchTerm, statusFilter, 1);
    });
  };

  if (isLoading && !offersData) {
    return (
      <AdminLayout user={user || { firstName: 'Admin', lastName: 'User', avatar: null }}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="figma-h3">Your Offers</h1>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout user={user || { firstName: 'Admin', lastName: 'User', avatar: null }}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="figma-h3">Your Offers</h1>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-xl">!</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Offers</h3>
              <p className="text-foreground/60 mb-4">{error}</p>
              <button
                onClick={() => fetchOffers()}
                className="figma-btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user || { firstName: 'Admin', lastName: 'User', avatar: null }}>
      <div className="space-y-12">
        {/* Header with Search and Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="figma-h3">Offers</h1>
          </div>
          <div className="flex items-center gap-3">
            <OffersSearchFilters 
              onSearch={handleSearch}
              isLoading={isLoading || isPending}
            />
            <button
              onClick={() => window.location.href = '/admin/offers/new'}
              className="cursor-pointer px-6 py-2 border border-primary/20 hover:border-primary/40 rounded-lg transition-all"
            >
              Create Offer
            </button>
          </div>
        </div>

        {/* Offers Grid */}
        {offersData && offersData.offers.length > 0 ? (
          <>
            <div className="space-y-6">
              {offersData.offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>

            {/* Pagination */}
            <OffersPagination
              currentPage={offersData.pagination.page}
              totalPages={offersData.pagination.totalPages}
              hasNext={offersData.pagination.hasNext}
              hasPrev={offersData.pagination.hasPrev}
              total={offersData.pagination.total}
              limit={offersData.pagination.limit}
            />
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Offers Found</h3>
              <p className="text-foreground/90 mb-4">
                {search || status 
                  ? 'No offers match your search criteria. Try adjusting your filters.'
                  : 'You don\'t have any offers yet. Start by creating your first offer.'
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
    </AdminLayout>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <AdminLayout user={{ firstName: 'Admin', lastName: 'User', avatar: null }}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="figma-h3">Your Offers</h1>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    }>
      <OffersContent />
    </Suspense>
  );
}