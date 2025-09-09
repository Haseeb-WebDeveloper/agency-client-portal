"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";

interface OffersSearchFiltersProps {
  onSearch: (search: string, status: string) => void;
  isLoading?: boolean;
  currentStatus?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "New" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export function OffersSearchFilters({
  onSearch,
  isLoading = false,
  currentStatus = "",
}: OffersSearchFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync status with currentStatus prop
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const handleSearch = () => {
    startTransition(() => {
      onSearch(search, status);
    });
  };

  const handleClear = () => {
    setSearch("");
    setStatus("");
    startTransition(() => {
      onSearch("", "");
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center gap-3 relative">
      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-3 cursor-pointer px-4 py-2 border rounded-lg transition-all ${
          showFilters || status
            ? "border-primary bg-primary/5 text-primary"
            : "border-primary/20 text-foreground/60 hover:border-primary/40"
        }`}
        disabled={isLoading || isPending}
        type="button"
      >
        <Image src="/icons/filter.svg" alt="Filter" width={15} height={15} />
        <span className="text-foreground">Filter</span>
        <Image
          src="/icons/filter-down.svg"
          alt="Chevron Down"
          width={15}
          height={15}
        />
      </button>

      {/* Expanded Filters */}
      {showFilters && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 min-w-[220px] p-4 bg-card border border-primary/20 rounded-lg shadow-lg z-10"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <div className="flex flex-col gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="offer-status"
                      value={option.value}
                      checked={status === option.value}
                      onChange={() => setStatus(option.value)}
                      className="accent-primary"
                      disabled={isLoading || isPending}
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSearch}
                disabled={isLoading || isPending}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-all text-sm"
                type="button"
              >
                Apply
              </button>
              <button
                onClick={handleClear}
                disabled={isLoading || isPending}
                className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 transition-all text-sm"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
