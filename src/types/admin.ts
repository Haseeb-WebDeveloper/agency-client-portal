export interface TeamMember {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface Client {
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

export interface ClientsData {
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



