"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle, Paperclip } from "lucide-react";
import { format } from "date-fns";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  media: any[] | null;
  validUntil: string | null;
  createdAt: string;
}

interface OfferCardProps {
  offer: Offer;
}

const statusBadge: Record<
  string,
  { label: string; dot: string; border: string }
> = {
  NEW: { label: "New", dot: "bg-primary", border: "border-primary/20" },
  PENDING_REVIEW: {
    label: "Pending Review",
    dot: "bg-orange-500",
    border: "border-primary/20",
  },
  IN_DISCUSSION: {
    label: "In Discussion",
    dot: "bg-amber-500",
    border: "border-primary/20",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-emerald-500",
    border: "border-primary/20",
  },
  DECLINED: {
    label: "Declined",
    dot: "bg-red-500",
    border: "border-primary/20",
  },
};

export function ClientOfferCard({ offer }: OfferCardProps) {
  const [open, setOpen] = useState(false);
  const s = statusBadge[offer.status] || statusBadge.NEW;

  return (
    <>
      <div
        className="relative cursor-pointer rounded-lg border border-primary/20 hover:border-primary/40 transition"
        onClick={() => setOpen(true)}
      >
        <div className="p-5 flex gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {offer.title}
              </h3>
              <div
                className={`px-2 py-0.5 rounded-full text-xs border ${s.border} flex items-center gap-2`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {offer.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{offer.media?.length ?? 0} files</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(offer.createdAt), "do MMM, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{offer.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-muted-foreground">{offer.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-primary/20">
                <Paperclip className="w-4 h-4 mr-2" /> Project Scope
              </Button>
              <Button variant="outline" className="border-primary/20">
                Reference 1
              </Button>
              <Button variant="outline" className="border-primary/20">
                Reference 2
              </Button>
            </div>
            <div>
              <Button className="bg-primary">
                <MessageCircle className="w-4 h-4 mr-2" /> Message us
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
