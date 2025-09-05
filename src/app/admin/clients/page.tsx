'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ClientCard } from '@/components/admin/client-card';
import { ClientsSearchFilters } from '@/components/admin/clients-search-filters';
import { ClientsPagination } from '@/components/admin/clients-pagination';
import { CreateClientModal } from '@/components/admin/create-client-modal';
import { requireAdmin } from '@/lib/auth';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string | null;
}

interface Client {
  id: string;
  name: string;
  description: string;
  logo?: string | null;
  website?: string | null;
  activeContracts: number;
  pendingOffers: number;
  lastActivity: string;
  teamMembers: TeamMember[];
  totalTeamMembers: number;
}

interface ClientsData {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [clientsData, setClientsData] = useState<ClientsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || '';

  const fetchClients = async (searchTerm: string = search, sortFilter: string = sortBy, pageNum: number = page) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '30',
        ...(searchTerm && { search: searchTerm }),
        ...(sortFilter && { sortBy: sortFilter }),
      });

      const response = await fetch(`/api/admin/clients?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClientsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Get user data
    const getUser = async () => {
      try {
        const userData = await requireAdmin();
        setUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
        });
      } catch (err) {
        console.error('Error getting user:', err);
      }
    };
    
    getUser();
    fetchClients();
  }, [page, search, sortBy]);

  const handleSearch = (searchTerm: string, sortFilter: string) => {
    startTransition(() => {
      fetchClients(searchTerm, sortFilter, 1);
    });
  };

  const handleClientCreated = () => {
    setShowCreateModal(false);
    // Refresh the clients list
    fetchClients();
  };

  if (isLoading && !clientsData) {
    return (
      <AdminLayout user={user || { firstName: 'Admin', lastName: 'User', avatar: null }}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="figma-h3">Our Clients</h1>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {/* <p className="text-foreground/60">Loading clients...</p> */}
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
              <h1 className="figma-h3">Our Clients</h1>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-xl">!</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Clients</h3>
              <p className="text-foreground/60 mb-4">{error}</p>
              <button
                onClick={() => fetchClients()}
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
        {/* Header with Search, Filter, and Add */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="figma-h3">Our Clients</h1>
          </div>
          <div className="flex items-center gap-3">
            <ClientsSearchFilters 
              onSearch={handleSearch}
              isLoading={isLoading || isPending}
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer px-6 py-2 border border-primary/20 hover:border-primary/40 rounded-lg transition-all"
            >
             Create Client
            </button>
          </div>
        </div>

        {/* Clients Grid */}
        {clientsData && clientsData.clients.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-6">
              {clientsData.clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>

            {/* Pagination */}
            <ClientsPagination
              currentPage={clientsData.pagination.page}
              totalPages={clientsData.pagination.totalPages}
              hasNext={clientsData.pagination.hasNext}
              hasPrev={clientsData.pagination.hasPrev}
              total={clientsData.pagination.total}
              limit={clientsData.pagination.limit}
            />
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Clients Found</h3>
              <p className="text-foreground/60 mb-4">
                {search || sortBy 
                  ? 'No clients match your search criteria. Try adjusting your filters.'
                  : 'You don\'t have any clients yet. Start by adding your first client.'
                }
              </p>
              {(search || sortBy) && (
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

        {/* Create Client Modal */}
        {showCreateModal && (
          <CreateClientModal
            onClose={() => setShowCreateModal(false)}
            onClientCreated={handleClientCreated}
          />
        )}
      </div>
    </AdminLayout>
  );
}