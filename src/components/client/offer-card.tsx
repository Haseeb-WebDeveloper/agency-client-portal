"use client";

import { useState, useCallback } from "react";
import { MediaFile } from "@/types/models";
import { format } from "date-fns";
import { Calendar, FileText, Sparkles } from "lucide-react";
import { EnhancedOfferModal } from "./enhanced-offer-modal";
import { ClientStatusConfig } from "@/constants/data";

interface Room {
  id: string;
  name: string;
  description: string | null;
  type: string;
  logo: string | null;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  media: MediaFile[] | null | any; // Make it more flexible to handle different data types
  createdAt: string;
  hasReviewed: boolean;
  rooms: Room[];
}

interface OfferCardProps {
  offer: Offer;
  onOfferUpdated?: (offerId: string) => void;
}


export function ClientOfferCard({ offer, onOfferUpdated }: OfferCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusInfo =
    ClientStatusConfig[offer.status as keyof typeof ClientStatusConfig] 
  const StatusIcon = statusInfo.icon;
  const handleMarkAsSeen = useCallback(async (offerId: string) => {
    try {
      console.log("Marking offer as seen:", offerId);
      const response = await fetch(`/api/client/offers/${offerId}/seen`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(`Failed to mark offer as seen: ${response.status}`);
      }

      const result = await response.json();
      console.log("Offer marked as seen successfully:", result);

      // Notify parent component to refresh the offer
      if (onOfferUpdated) {
        onOfferUpdated(offerId);
      }
    } catch (error) {
      console.error("Error marking offer as seen:", error);
      throw error;
    }
  }, []);

  console.log("offer", offer);

  return (
    <>
      <div
        className="relative z-[20] flex flex-col lg:flex-row lg:w-[70%] cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Status Badge - Top Right */}
        <div
          className={`absolute border bottom-[100%] right-2 px-3 py-2 rounded-t-sm text-xs font-medium flex items-center gap-2 ${statusInfo.color}`}
        >
          <span>{statusInfo.label}</span>
        </div>
        {/* Left Section - Main Content */}
        <div className="lg:w-[40%] p-5 space-y-6">
          <h3 className="figma-paragraph-bold">{offer.title}</h3>
          <p className="figma-paragraph leading-relaxed">
            {offer.description || "No description provided"}
          </p>
        </div>

        {/* Right Section - Metadata */}
        <div className="z-20 p-5 min-h-full lg:border-l flex flex-col gap-4">
          {/* Service Tags */}
          <div className="w-fit flex flex-wrap gap-2">
            {offer.tags && offer.tags.length > 0 ? (
              offer.tags.map((tag, index) => (
                <div
                  key={index}
                  className="px-2 py-1 text-sm rounded-xl border border-foreground/20 font-medium"
                >
                  {tag}
                </div>
              ))
            ) : (
              <div className="px-2 py-1 text-sm rounded-xl border border-foreground/20 font-medium text-muted-foreground">
                No tags
              </div>
            )}
          </div>

          {/* File Count and Date */}
          <div className="w-fit flex items-center justify-start gap-4 text-sm">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>
                {Array.isArray(offer.media)
                  ? offer.media.length
                  : offer.media
                  ? 1
                  : 0}{" "}
                files
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(offer.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      <EnhancedOfferModal
        offer={offer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMarkAsSeen={handleMarkAsSeen}
      />
    </>
  );
}




