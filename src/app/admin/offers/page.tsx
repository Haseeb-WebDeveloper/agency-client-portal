"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OfferCard } from "@/components/admin/offer-card";
// import { OffersSearchFilters } from "@/components/admin/offers-search-filters";
import { OffersPagination } from "@/components/admin/offers-pagination";
import { MediaFile } from "@/types/models";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
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

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const fetchOffers = async (
    searchTerm: string = search,
    statusFilter: string = status,
    pageNum: number = page
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "30",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      // Log the request for debugging
      const url = `/api/admin/offers?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Failed to fetch offers: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);

          // Use the most detailed error message available
          errorMessage =
            errorData.details ||
            errorData.message ||
            errorData.error ||
            errorMessage;
        } catch (parseError) {
          // If we can't parse the error, log the response text
          try {
            const errorText = await response.text();
            console.error("API Error Text Response:", errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error("Failed to read error response:", textError);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setOffersData(data);
    } catch (err) {
      console.error("Error fetching offers:", err);
      // Provide a more user-friendly error message
      let errorMessage =
        "An unexpected error occurred while fetching offers. Please try again.";

      if (err instanceof Error) {
        // Check if it's a network error
        if (err.name === "TypeError" && err.message.includes("fetch")) {
          errorMessage =
            "Network error: Unable to connect to the server. Please check your internet connection.";
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [page, search, status]);

  const handleSearch = (searchTerm: string, statusFilter: string) => {
    startTransition(() => {
      fetchOffers(searchTerm, statusFilter, 1);
    });
  };

  if (error) {
    return (
      <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
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
            <h3 className="text-lg font-medium text-foreground mb-2">
              Error Loading Offers
            </h3>
            <p className="text-foreground/60 mb-4">{error}</p>
            <button onClick={() => fetchOffers()} className="figma-btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 md:px-8 md:py-6 px-4 py-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="figma-h3">Offers</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* <OffersSearchFilters
            onSearch={handleSearch}
            isLoading={isLoading || isPending}
          /> */}
          <button
            onClick={() => (window.location.href = "/admin/offers/new")}
            className="w-full md:w-fit cursor-pointer px-6 py-2 bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] rounded-lg transition-all"
          >
            Create Offer
          </button>
        </div>
      </div>

      {/* Loading State */}
      {(isLoading || isPending) && !offersData ? (
        <div className="flex flex-wrap gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="border border-primary/20 rounded-lg p-6 w-[350px] space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10"></div>
                <div className="flex-1">
                  <div className="h-5 bg-primary/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-primary/10 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-primary/10 rounded w-full"></div>
              <div className="h-3 bg-primary/10 rounded w-2/3"></div>
              <div className="pt-4 flex justify-between">
                <div className="h-8 w-24 bg-primary/10 rounded"></div>
                <div className="h-8 w-24 bg-primary/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Offers Grid */}
      {offersData && offersData.offers.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-12">
            {offersData.offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          {/* Pagination */}
          {offersData.pagination.totalPages > 1 && (
            <OffersPagination
              currentPage={offersData.pagination.page}
              totalPages={offersData.pagination.totalPages}
              hasNext={offersData.pagination.hasNext}
              hasPrev={offersData.pagination.hasPrev}
              total={offersData.pagination.total}
              limit={offersData.pagination.limit}
            />
          )}
        </>
      ) : null}

      {/* Empty State */}
      {!isLoading &&
        !isPending &&
        offersData &&
        offersData.offers.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Offers Found
              </h3>
              <p className="text-foreground/90 mb-4">
                {search || status
                  ? "No offers match your search criteria. Try adjusting your filters."
                  : "You don't have any offers yet. Start by creating your first offer."}
              </p>
              {(search || status) && (
                <button
                  onClick={() => handleSearch("", "")}
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

export default function OffersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 md:px-8 md:py-6 px-4 py-6">
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
      }
    >
      <OffersContent />
    </Suspense>
  );
}
