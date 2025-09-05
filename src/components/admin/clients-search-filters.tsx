'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Check } from 'lucide-react';
import Image from 'next/image';

interface ClientsSearchFiltersProps {
  onSearch: (search: string, sortBy: string) => void;
  isLoading?: boolean;
}

export function ClientsSearchFilters({ onSearch, isLoading }: ClientsSearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      
      if (sortBy) {
        params.set('sortBy', sortBy);
      } else {
        params.delete('sortBy');
      }
      
      params.delete('page'); // Reset to first page
      
      router.push(`/admin/clients?${params.toString()}`);
      onSearch(search, sortBy);
    });
  };

  const handleClear = () => {
    setSearch('');
    setSortBy('');
    startTransition(() => {
      router.push('/admin/clients');
      onSearch('', '');
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (filterType: string) => {
    const newSortBy = sortBy === filterType ? '' : filterType;
    setSortBy(newSortBy);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      
      if (newSortBy) {
        params.set('sortBy', newSortBy);
      } else {
        params.delete('sortBy');
      }
      
      params.delete('page');
      
      router.push(`/admin/clients?${params.toString()}`);
      onSearch(search, newSortBy);
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Search Bar */}
      {/* <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-64 pl-10 pr-4 py-3 bg-transparent border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          disabled={isPending || isLoading}
        />
      </div> */}

      {/* Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 cursor-pointer px-4 py-2 border rounded-lg transition-all ${
            showFilters || sortBy
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-primary/20 text-foreground/60 hover:border-primary/40'
          }`}
          disabled={isPending || isLoading}
        >
          <Image src="/icons/filter.svg" alt="Filter" width={15} height={15} />
          <span className="text-foreground">Filter</span>
          <Image src="/icons/filter-down.svg" alt="Chevron Down" width={15} height={15} />
        </button>

        {/* Dropdown Menu */}
        {showFilters && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-primary/20 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Filter Clients</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sortBy === 'new'}
                      onChange={() => handleFilterChange('new')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      sortBy === 'new' 
                        ? 'bg-primary border-primary' 
                        : 'border-foreground/40'
                    }`}>
                      {sortBy === 'new' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">New Messages</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sortBy === 'oldest'}
                      onChange={() => handleFilterChange('oldest')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      sortBy === 'oldest' 
                        ? 'bg-primary border-primary' 
                        : 'border-foreground/40'
                    }`}>
                      {sortBy === 'oldest' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">Last checked</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sortBy === 'alphabetical'}
                      onChange={() => handleFilterChange('alphabetical')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      sortBy === 'alphabetical' 
                        ? 'bg-primary border-primary' 
                        : 'border-foreground/40'
                    }`}>
                      {sortBy === 'alphabetical' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">A-Z</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Button */}
      {/* <button
        onClick={handleSearch}
        disabled={isPending || isLoading}
        className="figma-btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Searching...' : 'Search'}
      </button> */}

      {/* Clear Button */}
      {/* {(search || sortBy) && (
        <button
          onClick={handleClear}
          disabled={isPending || isLoading}
          className="px-4 py-3 border border-destructive/20 text-destructive hover:bg-destructive/5 rounded-lg transition-all disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      )} */}
    </div>
  );
}
