"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface OffersSearchFiltersProps {
  onSearch: (search: string, status: string) => void;
  isLoading?: boolean;
}

export function OffersSearchFilters({
  onSearch,
  isLoading = false,
}: OffersSearchFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
        <Input
          placeholder="Search offers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 w-64"
          disabled={isLoading || isPending}
        />
      </div>

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        disabled={isLoading || isPending}
        className="bg-primary hover:bg-primary/90"
      >
        {isLoading || isPending ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>

      {/* Filter Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="border-primary/20 hover:border-primary/40"
        disabled={isLoading || isPending}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
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
                    <SelectItem value="SENT">New</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
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
