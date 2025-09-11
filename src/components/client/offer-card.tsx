"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaFile } from "@/types/models";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, FileText, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  media: MediaFile[] | null | any; // Make it more flexible to handle different data types
  validUntil: string | null;
  createdAt: string;
}

interface OfferCardProps {
  offer: Offer;
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-800 text-gray-300 border-gray-600",
    icon: null,
  },
  SENT: {
    label: "New!",
    color: "bg-blue-600 text-white border-blue-500",
    icon: Sparkles,
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-green-600 text-white border-green-500",
    icon: null,
  },
  DECLINED: {
    label: "Declined",
    color: "bg-red-600 text-white border-red-500",
    icon: null,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-gray-800 text-gray-300 border-gray-600",
    icon: null,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "bg-gray-800 text-gray-300 border-gray-600",
    icon: null,
  },
  PENDING: {
    label: "Pending Review",
    color: "bg-gray-800 text-white border-gray-600",
    icon: null,
  },
};

export function ClientOfferCard({ offer }: OfferCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusInfo =
    statusConfig[offer.status as keyof typeof statusConfig] ||
    statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <div
        className="relative z-[20] flex flex-col lg:flex-row lg:w-[70%] cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Status Badge - Top Right */}
        <div className="absolute bottom-[101%] right-2 px-3 py-1 bg-gradient-to-tr from-[#FF2AFF] to-[#6B42D1] rounded-t-sm text-xs font-medium flex items-center gap-2">
          <span>Pending</span>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{offer.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-muted-foreground">{offer.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
