import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
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
    color: "bg-primary/20 text-primary-foreground border-primary/40",
    dotColor: "bg-orange-500",
  },
  PENDING_APPROVAL: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40",
    dotColor: "bg-yellow-500",
  },
  ACTIVE: {
    label: "Active",
    color: "bg-green-500/20 text-green-500 border-green-500/40",
    dotColor: "bg-green-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-blue-500/20 text-blue-500 border-blue-500/40",
    dotColor: "bg-blue-500",
  },
  TERMINATED: {
    label: "Terminated",
    color: "bg-red-500/20 text-red-500 border-red-500/40",
    dotColor: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-muted text-muted-foreground border-muted",
    dotColor: "bg-muted-foreground",
  },
};

export function ContractCard({ contract }: ContractCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const statusInfo =
    statusConfig[contract.status as keyof typeof statusConfig] ||
    statusConfig.DRAFT;

  const handleCardClick = () => {
    // Navigate to contract detail page
    window.location.href = `/admin/contracts/${contract.id}`;
  };

  const handleMessageUs = () => {
    // TODO: Implement message functionality
    console.log("Message us clicked for contract:", contract.id);
  };

  return (
    <>
      <div
        className="relative cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border border-primary/20 bg-card hover:border-primary/40"
        onClick={handleCardClick}
      >
        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border ${statusInfo.color}`}>
            <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground pr-20">
            {contract.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {contract.description || "No description provided"}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {contract.tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                className="px-2 py-1 text-xs rounded-full border border-primary/20 text-foreground font-medium"
              >
                {tag}
              </div>
            ))}
            {contract.tags.length > 3 && (
              <div className="px-2 py-1 text-xs rounded-full border border-primary/20 text-muted-foreground">
                +{contract.tags.length - 3} more
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">{contract.progressPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                style={{ width: `${contract.progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Footer - Media Files and Date */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span>{contract.mediaFilesCount} files</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(contract.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border ${statusInfo.color}`}>
                  <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
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
                <span className="text-foreground font-medium">{contract.progressPercentage}%</span>
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
                <p className="font-medium text-foreground">{contract.client_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium text-foreground">
                  {format(new Date(contract.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Media Files:</span>
                <p className="font-medium text-foreground">{contract.mediaFilesCount} files</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium text-foreground">{statusInfo.label}</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex items-center justify-between pt-4 border-t border-primary/20">
              <p className="text-foreground/80">Need to discuss this contract?</p>
              <Button
                onClick={handleMessageUs}
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
