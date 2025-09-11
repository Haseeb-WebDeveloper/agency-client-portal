"use client";

import { useState, useTransition, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface ContractsSearchFiltersProps {
  onSearch: (search: string, status: string) => void;
  isLoading?: boolean;
  currentStatus?: string;
}

export function ContractsSearchFilters({
  onSearch,
  isLoading = false,
  currentStatus = "",
}: ContractsSearchFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedStatus = useDebounce(status, 300);

  // Sync status with currentStatus prop
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

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

  const hasActiveFilters = search || status;

  // Auto-apply when status changes with debounce
  useEffect(() => {
    if (!showFilters) {
      startTransition(() => onSearch(search, debouncedStatus));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStatus]);

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      {/* <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
        <Input
          placeholder="Search contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 w-64"
          disabled={isLoading || isPending}
        />
      </div> */}

      {/* Search Button */}
      {/* <Button
        onClick={handleSearch}
        disabled={isLoading || isPending}
        className="bg-primary hover:bg-primary/90"
      >
        {isLoading || isPending ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button> */}

      {/* Filter Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-3 cursor-pointer px-4 py-2 border rounded-lg transition-all ${
          showFilters || status
            ? "border-primary bg-primary/5 text-primary"
            : "border-primary/20 text-foreground/60 hover:border-primary/40"
        }`}
        disabled={isLoading || isPending}
      >
        <Image src="/icons/filter.svg" alt="Filter" width={15} height={15} />
        <span className="text-foreground">Filter</span>
        <Image
          src="/icons/filter-down.svg"
          alt="Chevron Down"
          width={15}
          height={15}
        />
      </Button>

      {/* Clear Filters */}
      {/* {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={handleClear}
          disabled={isLoading || isPending}
          className="text-foreground/60 hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )} */}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-primary/20 rounded-lg shadow-lg z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">
                      Pending Approval
                    </SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
