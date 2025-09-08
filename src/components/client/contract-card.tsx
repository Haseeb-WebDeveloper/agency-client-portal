"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Paperclip, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  progressPercentage: number;
  mediaFilesCount: number;
  createdAt: string;
}

interface ContractCardProps {
  contract: Contract;
}

const statusConfig: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "border-primary/20",
    dotColor: "bg-muted-foreground",
  },
  PENDING_APPROVAL: {
    label: "Pending",
    color: "border-primary/20",
    dotColor: "bg-yellow-500",
  },
  ACTIVE: {
    label: "Active",
    color: "border-primary/20",
    dotColor: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "border-primary/20",
    dotColor: "bg-primary",
  },
  TERMINATED: {
    label: "Terminated",
    color: "border-primary/20",
    dotColor: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    color: "border-primary/20",
    dotColor: "bg-muted-foreground",
  },
};

export function ClientContractCard({ contract }: ContractCardProps) {
  const [open, setOpen] = useState(false);
  const statusInfo = statusConfig[contract.status] || statusConfig.DRAFT;

  return (
    <>
      <div
        className="relative cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border border-primary/20 hover:border-primary/40"
        onClick={() => setOpen(true)}
      >
        <div className="absolute top-4 right-4 z-10">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border ${statusInfo.color}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
            ></div>
            <span>{statusInfo.label}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground pr-20">
            {contract.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {contract.description || "No description provided"}
          </p>
          <div className="flex flex-wrap gap-2">
            {contract.tags?.slice(0, 3).map((tag) => (
              <div
                key={tag}
                className="px-2 py-1 text-xs rounded-full border border-primary/20 text-foreground font-medium"
              >
                {tag}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">
                {contract.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                style={{ width: `${contract.progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span>{contract.mediaFilesCount} files</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(contract.createdAt), "do MMM, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{contract.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {contract.tags?.map((tag) => (
                <div
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full border border-primary/20 text-foreground font-medium"
                >
                  {tag}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">
                  {contract.progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${contract.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
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

            <div className="text-sm text-muted-foreground">
              Have a query?{" "}
              <button className="text-primary inline-flex items-center gap-1">
                <MessageCircle className="w-4 h-4" /> Message Us
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
