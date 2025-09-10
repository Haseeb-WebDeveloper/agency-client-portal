import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Paperclip, MessageCircle } from "lucide-react";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  progressPercentage: number;
  mediaFilesCount: number;
  createdAt: string;
  client_name: string;
  client_logo: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

interface ContractCardProps {
  contract: Contract;
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    color: "border-[#A78BFA] text-[#A78BFA] bg-[#A78BFA]/10",
    dotColor: "bg-orange-500",
  },
  PENDING_APPROVAL: {
    label: "Pending",
    color: "border-yellow-500 text-yellow-500 bg-yellow-500/10",
    dotColor: "bg-yellow-500",
  },
  ACTIVE: {
    label: "Active",
    color: "border-green-500 text-green-400 bg-green-500/10",
    dotColor: "bg-green-400",
  },
  COMPLETED: {
    label: "Completed",
    color: "border-blue-500 text-blue-400 bg-blue-500/10",
    dotColor: "bg-blue-400",
  },
  TERMINATED: {
    label: "Terminated",
    color: "border-red-500 text-red-400 bg-red-500/10",
    dotColor: "bg-red-400",
  },
  EXPIRED: {
    label: "Expired",
    color: "border-muted text-muted-foreground bg-muted/10",
    dotColor: "bg-muted-foreground",
  },
};

export function ContractCard({ contract }: ContractCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusInfo =
    statusConfig[contract.status as keyof typeof statusConfig] ||
    statusConfig.DRAFT;

  const handleCardClick = () => {
    window.location.href = `/admin/contracts/${contract.id}`;
  };

  // Custom purple for progress bar
  const progressBarGradient =
    "bg-gradient-to-r from-[#A259FF] via-[#C84AFF] to-[#F72585]";

  // Custom card border and background
  return (
    <>
      <div
        className="relative flex flex-col justify-between cursor-pointer rounded-tl-xl border border-primary/20 transition-all duration-200"
        onClick={handleCardClick}
      >
        {/* Status Badge - Top Right */}
        <div className="absolute -top-[26px] right-0 z-10">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs font-medium border border-b-0 ${statusInfo.color} shadow-sm`}
            style={{
              background: contract.status === "ACTIVE" ? "#18102B" : undefined,
            }}
          >
            <div
              className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
            ></div>
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-5 pb-4 space-y-4">
          {/* Title */}
          <h3 className="text-xl font-bold leading-tight">{contract.title}</h3>

          {/* Description */}
          <p className="text-base line-clamp-2 leading-relaxed">
            {contract.description || "No description provided"}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {contract.tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                className="px-3 py-1 text-sm rounded-lg border border-primary/30  font-medium bg-transparent"
              >
                {tag}
              </div>
            ))}
            {contract.tags.length > 3 && (
              <div className="px-3 py-1 text-sm rounded-lg border border-primary/30  bg-transparent">
                +{contract.tags.length - 3} more
              </div>
            )}
          </div>
        </div>

        {/* Footer - Media Files and Date */}
        <div className="">
          {/* Progress Bar */}
          <div className="space-y-2 pt-2 px-5">
            <div className="flex items-center gap-2">
              <div className="w-full bg-[#2A1A47] rounded-full h-1.5 relative">
                <div
                  className={`${progressBarGradient} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${contract.progressPercentage}%` }}
                ></div>
              </div>
              <span
                className=" text-sm font-medium pl-2"
                style={{ minWidth: 40 }}
              >
                {contract.progressPercentage}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between  text-base border-t border-[#2A1A47] px-5 py-3 mt-2">
            <div className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 " />
              <span>{contract.mediaFilesCount} files</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 " />
              <span>
                {format(new Date(contract.createdAt), "do MMM, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details Modal (unchanged, but you can style it similarly if needed) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border ${statusInfo.color}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
                  ></div>
                  <span>{statusInfo.label}</span>
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {contract.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <p className="text-foreground/80 leading-relaxed">
                {contract.description || "No description provided"}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">Progress</span>
                <span className="text-foreground font-medium">
                  {contract.progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${contract.progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Service tags */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Services</h4>
              <div className="flex flex-wrap gap-2">
                {contract.tags.map((tag) => (
                  <div
                    key={tag}
                    className="px-2 py-1 rounded text-sm font-medium bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Client:</span>
                <p className="font-medium text-foreground">
                  {contract.client_name}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium text-foreground">
                  {format(new Date(contract.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Media Files:</span>
                <p className="font-medium text-foreground">
                  {contract.mediaFilesCount} files
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium text-foreground">
                  {statusInfo.label}
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex items-center justify-between pt-4 border-t border-primary/20">
              <p className="text-foreground/80">
                Need to discuss this contract?
              </p>
              <Button
                onClick={() => {}}
                className="bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message us
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
