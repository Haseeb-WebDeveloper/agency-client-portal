"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Calendar, RefreshCw, ExternalLink } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    description: string;
    logo?: string | null;
    website?: string | null;
    activeContracts: number;
    pendingOffers: number;
    lastActivity: string; // ISO date string
    teamMembers?: TeamMember[];
    totalTeamMembers?: number;
  };
}

export function ClientCard({ client }: ClientCardProps) {
  const [showAllMembers, setShowAllMembers] = useState(false);

  // Ensure teamMembers is always an array
  const teamMembers = client.teamMembers || [];
  const totalTeamMembers = client.totalTeamMembers || 0;

  const displayMembers = showAllMembers ? teamMembers : teamMembers.slice(0, 4);
  const remainingCount = totalTeamMembers - 4;

  return (
    <div className="border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-200 group">
      {/* Header with logo and name */}
      <Link
        href={`/admin/clients/${client.id}`}
        className="flex items-center gap-4 mb-6"
      >
        {client.logo ? (
          <div className="w-16 h-16 rounded-full">
            <Image
              src={client.logo}
              alt={client.name}
              width={200}
              height={200}
              className="rounded-full object-cover aspect-square"
            />
          </div>
        ) : (
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-white font-bold text-sm">
              {client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="figma-paragraph-bold">{client.name}</h3>
        </div>
      </Link>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/contract.svg"
            alt="Active Contracts"
            width={20}
            height={20}
          />
          <span className="">
            <span className="font-bold text-foreground">
              {client.activeContracts}
            </span>{" "}
            Active contracts
          </span>
        </div>
        <div className="w-px h-6 bg-foreground"></div>
        <div className="flex items-center gap-2">
          <Image
            src="/icons/list.svg"
            alt="Pending Offers"
            width={20}
            height={20}
          />
          <span className="">
            <span className="font-bold text-foreground">
              {client.pendingOffers}
            </span>{" "}
            pending Offers
          </span>
        </div>
      </div>

      {/* Last Activity */}
      <div className="flex items-center gap-2 mb-6">
        <Image
          src="/icons/stop-watch.svg"
          alt="Last Activity"
          width={20}
          height={20}
        />
        <span className=" font-medium">Last Activity : </span>
        <span className="text-foreground italic underline">
          {(() => {
            try {
              const date = new Date(client.lastActivity);
              if (isNaN(date.getTime())) {
                return "Unknown";
              }
              return formatDistanceToNow(date, {
                addSuffix: true,
              });
            } catch (error) {
              return "Unknown";
            }
          })()}
        </span>
      </div>

      {/* Team Members */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarStack size={32} className="">
            {displayMembers.map((member) => (
              <Avatar key={member.id}>
                {member.avatar ? (
                  <AvatarImage src={member.avatar} alt={member.name} className="w-12 h-12" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {member.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingCount > 0 && (
              <Avatar>
                <AvatarFallback className="bg-primary text-white text-sm font-medium">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            )}
          </AvatarStack>
        </div>
        <div className="text-foreground">
          <span className="font-bold">{client.totalTeamMembers}</span> Team
          members
        </div>
      </div>
    </div>
  );
}
