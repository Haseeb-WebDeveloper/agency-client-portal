"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Users,
  Gift,
  Calendar,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EditClientModal } from "@/components/admin/edit-client-modal";
import Link from "next/link";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  value: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  status: string;
  validUntil: string | null;
  hasReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientDetails {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    contracts: {
      total: number;
      active: number;
      pending: number;
      completed: number;
    };
    offers: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
    };
    teamMembers: {
      total: number;
      active: number;
    };
  };
  teamMembers: TeamMember[];
  contracts: Contract[];
  offers: Offer[];
  rooms: Room[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/clients/${clientId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Client not found");
        }
        throw new Error("Failed to fetch client details");
      }

      const data = await response.json();
      setClient(data.client);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching client details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const handleClientUpdated = () => {
    setShowEditModal(false);
    fetchClientDetails();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "draft":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-8 py-6">
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
      <div className="space-y-6 px-8 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Error Loading Client
            </h3>
            <p className=" mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => fetchClientDetails()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6 px-8 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Client Not Found
            </h3>
            <p className=" mb-4">
              The client you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="figma-h4">Client Details</h1>
        </div>
        <Button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </Button>
      </div>

      {/* Client Info */}
      <div className="mt-10">
        <div className="flex items-start gap-6">
          <div className="relative">
            {client.logo ? (
              <Image
                src={client.logo}
                alt={client.name}
                width={130}
                height={130}
                className="rounded-full object-cover aspect-square"
              />
            ) : (
              <div className="w-130 h-130 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl ">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="figma-h3 mb-2">{client.name}</h2>
            {client.description && (
              <p className="figma-paragraph mb-4 line-clamp-1 w-full">
                {client.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 ">
              {client.website && (
                <div className="flex items-center gap-2">
                  <Link
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors"
                  >
                    {client.website}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined{" "}
                {formatDistanceToNow(new Date(client.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <div className="flex gap-2 border border-primary/20 px-3 py-2 rounded-lg text-base items-center">
          <Image
            src="/icons/contract.svg"
            alt="Active Contracts"
            width={18}
            height={18}
          />
          <p className="">{client.stats.contracts.active}</p>
          <p className="">Active Contracts</p>
        </div>

        <div className="flex gap-2 border border-primary/20 px-4 py-2.5 rounded-lg text-base items-center">
          <Image
            src="/icons/offer.svg"
            alt="Pending Contracts"
            width={18}
            height={18}
          />
          <p className="">{client.stats.offers.pending}</p>
          <p className="">Pending Offers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        {/* Team Members */}
        <div className="space-y-6">
          <h3 className="text-lg ">
            Client team members
          </h3>
          <div className="space-y-4">
            {client.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src=""
                    alt={`${member.firstName} ${member.lastName}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {member.firstName.charAt(0)}
                    {member.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-white text-base">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-gray-400">{client.name} team</p>
                </div>
                {/* {member.role === "PRIMARY_CONTACT" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">★</span>
                  </div>
                )} */}
              </div>
            ))}
            {client.teamMembers.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                No team members found
              </p>
            )}
          </div>
        </div>

        {/* Client Groups/Rooms */}
        <div className="space-y-6">
          <h3 className="text-lg ">Client groups</h3>
          <div className="space-y-4">
            {client.rooms.map((room, index) => {
              const colors = [
                "bg-orange-500",
                "bg-green-500",
                "bg-gray-500",
                "bg-blue-500",
                "bg-purple-500",
              ];
              const colorClass = colors[index % colors.length];

              return (
                <div key={room.id} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}
                  >
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-base">
                      {room.name}
                    </p>
                    {room.description && (
                      <p className="text-sm text-gray-400">
                        {room.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {client.rooms.length === 0 && (
              <p className="text-center text-gray-400 py-8">No groups found</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onClientUpdated={handleClientUpdated}
        />
      )}
    </div>
  );
}
