"use client";

import { useState, useCallback, memo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  MessageCircle,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Eye,
  EyeOff,
  Loader2,
  X,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useLazyMedia } from "@/hooks/use-lazy-media";

// Flexible media file interface to handle different data structures
interface MediaFile {
  id?: string;
  fileName?: string;
  name?: string;
  url?: string;
  src?: string;
  path?: string;
  fileSize?: number;
  size?: number;
  mimeType?: string;
  type?: string;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  type: string;
  logo: string | null;
}

interface Contract {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  progressPercentage: number;
  mediaFilesCount: number;
  media: MediaFile[] | null;
  createdAt: string;
  hasReviewed: boolean;
  rooms: Room[];
}

interface ContractCardProps {
  contract: Contract;
  onMarkAsSeen?: (contractId: string) => Promise<void>;
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

const MediaPreview = memo(({ media }: { media: MediaFile[] }) => {
  const [showAll, setShowAll] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  // Ensure media is an array
  const mediaArray = Array.isArray(media) ? media : [];
  const displayCount = showAll ? mediaArray.length : 3;
  const visibleMedia = mediaArray.slice(0, displayCount);
  const { loadedMedia, observerRef } = useLazyMedia(mediaArray);

  // Debug log to understand media structure (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && mediaArray.length > 0) {
      console.log("Media data structure:", mediaArray[0]);
    }
  }, [mediaArray]);

  const getFileIcon = (mimeType: string | undefined | null) => {
    if (!mimeType || typeof mimeType !== "string") return File;
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.startsWith("video/")) return Video;
    return File;
  };

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || typeof bytes !== "number" || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = (file: MediaFile) => {
    const fileData = {
      url: file.url || file.src || file.path || "#",
      fileName: file.fileName || file.name || "download",
    };

    if (fileData.url && fileData.url !== "#") {
      const link = document.createElement("a");
      link.href = fileData.url;
      link.download = fileData.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file);
  };

  // Enhanced File Preview Component
  const FilePreviewCard = ({
    file,
    index,
  }: {
    file: MediaFile;
    index: number;
  }) => {
    const fileData = {
      id: file.id || file.fileName || file.name || `file-${index}`,
      fileName: file.fileName || file.name || "Unknown File",
      url: file.url || file.src || file.path || "#",
      fileSize: file.fileSize || file.size || 0,
      mimeType:
        file.mimeType ||
        (file.type === "image"
          ? "image/jpeg"
          : file.type === "video"
          ? "video/mp4"
          : file.type === "pdf"
          ? "application/pdf"
          : file.type === "document"
          ? "application/msword"
          : "application/octet-stream"),
    };

    const FileIcon = getFileIcon(fileData.mimeType);
    const isImage = fileData.mimeType && fileData.mimeType.startsWith("image/");
    const isVideo = fileData.mimeType && fileData.mimeType.startsWith("video/");
    const isPdf = fileData.mimeType && fileData.mimeType === "application/pdf";
    const isLoaded = loadedMedia.has(fileData.id);

    const renderPreview = () => {
      if (isImage) {
        return (
          <div className="relative group">
            <img
              src={fileData.url}
              alt={fileData.fileName}
              className="w-full h-20 object-cover rounded-lg border border-border"
              onClick={() => handlePreview(file)}
            />
          </div>
        );
      } else if (isVideo) {
        return (
          <div className="relative group">
            <video
              src={fileData.url}
              className="w-full h-20 object-cover rounded-lg border border-border"
              muted
              onClick={() => handlePreview(file)}
            />
          </div>
        );
      } else if (isPdf) {
        return (
          <div
            className="w-full h-20 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            onClick={() => handlePreview(file)}
          >
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
            <span className="text-xs text-red-600 dark:text-red-400 mt-1">
              PDF
            </span>
          </div>
        );
      } else {
        return (
          <div className="w-full h-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center">
            {isLoaded ? (
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            )}
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center px-1">
              {fileData.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
            </span>
          </div>
        );
      }
    };

    return (
      <div className="relative group">
        {renderPreview()}
        <div className="mt-2 space-y-1">
          <p
            className="text-xs font-medium text-foreground truncate"
            title={fileData.fileName}
          >
            {fileData.fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileData.fileSize)}
          </p>
        </div>
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handlePreview(file)}
            title="Preview"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleDownload(file)}
            title="Download"
            disabled={!fileData.url || fileData.url === "#"}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  if (!mediaArray || mediaArray.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No media files attached</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Attached Files</h3>
        {mediaArray.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1"
          >
            {showAll ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showAll ? "Show Less" : `Show All (${mediaArray.length})`}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleMedia.map((file, index) => (
          <FilePreviewCard
            key={file.id || file.fileName || file.name || `file-${index}`}
            file={file}
            index={index}
          />
        ))}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] w-full relative">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">
                {previewFile.fileName || previewFile.name || "File Preview"}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(previewFile)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {(() => {
                const fileData = {
                  url:
                    previewFile.url ||
                    previewFile.src ||
                    previewFile.path ||
                    "#",
                  mimeType:
                    previewFile.mimeType ||
                    (previewFile.type === "image"
                      ? "image/jpeg"
                      : previewFile.type === "video"
                      ? "video/mp4"
                      : previewFile.type === "pdf"
                      ? "application/pdf"
                      : previewFile.type === "document"
                      ? "application/msword"
                      : "application/octet-stream"),
                };

                if (fileData.mimeType.startsWith("image/")) {
                  return (
                    <img
                      src={fileData.url}
                      alt={
                        previewFile.fileName || previewFile.name || "Preview"
                      }
                      className="max-w-full max-h-full object-contain mx-auto"
                    />
                  );
                } else if (fileData.mimeType.startsWith("video/")) {
                  return (
                    <video
                      src={fileData.url}
                      controls
                      className="max-w-full max-h-full mx-auto"
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                } else if (fileData.mimeType === "application/pdf") {
                  return (
                    <iframe
                      src={fileData.url}
                      className="w-full h-[70vh] border-0 rounded"
                      title={
                        previewFile.fileName ||
                        previewFile.name ||
                        "PDF Preview"
                      }
                    />
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      {(() => {
                        const FileIcon = getFileIcon(fileData.mimeType);
                        return (
                          <FileIcon className="w-12 h-12 text-muted-foreground" />
                        );
                      })()}
                      <p className="mt-2 text-lg font-medium">
                        {fileData.mimeType.split("/")[1]?.toUpperCase() ||
                          "FILE"}
                      </p>
                      <p className="text-sm">
                        Preview not available for this file type
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => handleDownload(previewFile)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download to view
                      </Button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MediaPreview.displayName = "MediaPreview";

const RoomsSection = memo(({ rooms }: { rooms: Room[] }) => {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No discussion rooms available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 w-fit flex items-center gap-2">
        <p>Have questions about this contract?</p>
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/messages?room=${room.id}`}
            target="_blank"
            className="block text-xs py-2 px-3 rounded-full bg-primary text-foreground"
          >
            Message us
          </Link>
        ))}
      </div>
    </div>
  );
});

RoomsSection.displayName = "RoomsSection";

export const ClientContractCard = memo(
  ({ contract, onMarkAsSeen }: ContractCardProps) => {
    const [open, setOpen] = useState(false);
    const [isMarkingAsSeen, setIsMarkingAsSeen] = useState(false);
    const statusInfo = statusConfig[contract.status] || statusConfig.DRAFT;

    const handleMarkAsSeen = useCallback(async () => {
      if (!onMarkAsSeen || contract.hasReviewed) return;

      try {
        setIsMarkingAsSeen(true);
        await onMarkAsSeen(contract.id);
      } catch (error) {
        console.error("Failed to mark contract as seen:", error);
      } finally {
        setIsMarkingAsSeen(false);
      }
    }, [onMarkAsSeen, contract.id, contract.hasReviewed]);

    // Mark as seen when modal opens
    useEffect(() => {
      console.log("Modal effect triggered:", {
        isOpen: open,
        hasReviewed: contract.hasReviewed,
        hasOnMarkAsSeen: !!onMarkAsSeen,
      });
      if (open && !contract.hasReviewed && onMarkAsSeen) {
        console.log("Calling handleMarkAsSeen for contract:", contract.id);
        handleMarkAsSeen();
      }
    }, [open, contract.hasReviewed, onMarkAsSeen, handleMarkAsSeen, contract.id]);

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
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto pt-14">
            {/* Status */}
            <div
              className={`absolute top-0 left-4 px-3 py-1 rounded-b-lg border-b border-l border-r text-xs font-medium flex items-center gap-2 border ${statusInfo.color}`}
            >
              <span>{statusInfo.label}</span>
            </div>

            <div>
              <p className="text-3xl mb-2">{contract.title}</p>
              <p className="leading-relaxed text-foreground/90">
                {contract.description || "No description provided"}
              </p>
            </div>

            <div className="space-y-6">
              {/* Tags */}
              {contract.tags && contract.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contract.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 text-xs rounded-xl border border-primary/20 text-foreground font-medium"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Section */}
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

              {/* Media Files */}
              <MediaPreview media={contract.media || []} />

              {/* Discussion Rooms */}
              <RoomsSection rooms={contract.rooms} />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

ClientContractCard.displayName = "ClientContractCard";
