"use client";

import { useState, useCallback, memo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  MessageCircle,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { MediaFile as BaseMediaFile } from "@/types/models";
import { useLazyMedia } from "@/hooks/use-lazy-media";
import { ClientStatusConfig } from "@/constants/data";

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

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  media: MediaFile[] | null;
  createdAt: string;
  hasReviewed: boolean;
  rooms: Room[];
}

interface EnhancedOfferModalProps {
  offer: Offer;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsSeen?: (offerId: string) => Promise<void>;
}

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
        <p>Interested in this offer?</p>
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
        {/* {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/messages?room=${room.id}`}
            target="_blank"
            className="block"
          >
            <div className="border rounded-lg p-4 transition-colors">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  {room.logo ? (
                    <img
                      src={room.logo}
                      alt={room.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 " />
                    </div>
                  )}

                  <Link
                    className="text-xs py-2 px-3 rounded-lg bg-success/50 text-foreground"
                    href={`/messages?room=${room.id}`}
                  >
                    Send Message
                  </Link>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{room.name}</p>
                  {room.description && (
                    <p className="text-sm truncate pt-0.5">
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))} */}
      </div>
    </div>
  );
});

RoomsSection.displayName = "RoomsSection";

export const EnhancedOfferModal = memo(
  ({ offer, isOpen, onClose, onMarkAsSeen }: EnhancedOfferModalProps) => {
    const [isMarkingAsSeen, setIsMarkingAsSeen] = useState(false);

    const handleMarkAsSeen = useCallback(async () => {
      if (!onMarkAsSeen || offer.hasReviewed) return;

      try {
        setIsMarkingAsSeen(true);
        await onMarkAsSeen(offer.id);
      } catch (error) {
        console.error("Failed to mark offer as seen:", error);
      } finally {
        setIsMarkingAsSeen(false);
      }
    }, [onMarkAsSeen, offer.id, offer.hasReviewed]);

    // Mark as seen when modal opens
    useEffect(() => {
      console.log("Modal effect triggered:", {
        isOpen,
        hasReviewed: offer.hasReviewed,
        hasOnMarkAsSeen: !!onMarkAsSeen,
      });
      if (isOpen && !offer.hasReviewed && onMarkAsSeen) {
        console.log("Calling handleMarkAsSeen for offer:", offer.id);
        handleMarkAsSeen();
      }
    }, [isOpen, offer.hasReviewed, onMarkAsSeen, handleMarkAsSeen, offer.id]);

    const statusInfo =
      ClientStatusConfig[offer.status as keyof typeof ClientStatusConfig] ||
      ClientStatusConfig.SENT;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto pt-14">
          {/* status */}
          <div
            className={`absolute top-0 left-4 px-3 py-1 rounded-b-lg border-b border-l border-r text-xs font-medium flex items-center gap-2 border ${statusInfo.color}`}
          >
            <span>{statusInfo.label}</span>
          </div>

          <div>
            <p className="text-3xl mb-2">{offer.title}</p>
            <p className="leading-relaxed text-foreground/90">
              {offer.description || "No description provided"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Tags */}
            {offer.tags && offer.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {offer.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs rounded-xl border border-primary/20 text-foreground font-medium"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* Media Files */}
            <MediaPreview media={offer.media || []} />

            {/* Discussion Rooms */}
            <RoomsSection rooms={offer.rooms} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

EnhancedOfferModal.displayName = "EnhancedOfferModal";
