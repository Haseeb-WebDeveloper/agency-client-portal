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
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { MediaFile as BaseMediaFile } from "@/types/models";
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

interface Offer {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  media: MediaFile[] | null;
  validUntil: string | null;
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
  
  // Ensure media is an array
  const mediaArray = Array.isArray(media) ? media : [];
  const displayCount = showAll ? mediaArray.length : 3;
  const visibleMedia = mediaArray.slice(0, displayCount);
  const { loadedMedia, observerRef } = useLazyMedia(mediaArray);

  // Debug log to understand media structure (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && mediaArray.length > 0) {
      console.log('Media data structure:', mediaArray[0]);
    }
  }, [mediaArray]);

  const getFileIcon = (mimeType: string | undefined | null) => {
    if (!mimeType || typeof mimeType !== 'string') return File;
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    return File;
  };

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || typeof bytes !== 'number' || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <h3 className="text-lg font-semibold">Attached Files ({mediaArray.length})</h3>
        {mediaArray.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1"
          >
            {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAll ? 'Show Less' : `Show All (${mediaArray.length})`}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleMedia.map((file, index) => {
          // Handle different media data structures
          const fileData = {
            id: file.id || file.fileName || file.name || `file-${index}`,
            fileName: file.fileName || file.name || 'Unknown File',
            url: file.url || file.src || file.path || '#',
            fileSize: file.fileSize || file.size || 0,
            mimeType: file.mimeType || (file.type === 'image' ? 'image/jpeg' : 
                      file.type === 'video' ? 'video/mp4' : 
                      file.type === 'pdf' ? 'application/pdf' : 
                      file.type === 'document' ? 'application/msword' : 
                      'application/octet-stream')
          };

          const FileIcon = getFileIcon(fileData.mimeType);
          const isImage = fileData.mimeType && fileData.mimeType.startsWith('image/');
          const isVideo = fileData.mimeType && fileData.mimeType.startsWith('video/');
          const isLoaded = loadedMedia.has(fileData.id);
          
          return (
            <div
              key={fileData.id}
              ref={index === 0 ? observerRef : undefined}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {isImage ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      {isLoaded ? (
                        <img
                          src={fileData.url}
                          alt={fileData.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {/* Fallback icon - hidden by default */}
                      <div className="w-full h-full items-center justify-center hidden">
                        <FileIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={fileData.fileName}>
                    {fileData.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileData.fileSize)}
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => {
                        if (fileData.url && fileData.url !== '#') {
                          window.open(fileData.url, '_blank');
                        }
                      }}
                      disabled={!fileData.url || fileData.url === '#'}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MediaPreview.displayName = 'MediaPreview';

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
      <h3 className="text-lg font-semibold">Discussion Rooms</h3>
      <div className="space-y-2">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/messages?room=${room.id}`}
            className="block"
          >
            <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {room.logo ? (
                  <img
                    src={room.logo}
                    alt={room.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{room.name}</p>
                  {room.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {room.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

RoomsSection.displayName = 'RoomsSection';

export const EnhancedOfferModal = memo(({ 
  offer, 
  isOpen, 
  onClose, 
  onMarkAsSeen 
}: EnhancedOfferModalProps) => {
  const [isMarkingAsSeen, setIsMarkingAsSeen] = useState(false);

  const handleMarkAsSeen = useCallback(async () => {
    if (!onMarkAsSeen || offer.hasReviewed) return;
    
    try {
      setIsMarkingAsSeen(true);
      await onMarkAsSeen(offer.id);
    } catch (error) {
      console.error('Failed to mark offer as seen:', error);
    } finally {
      setIsMarkingAsSeen(false);
    }
  }, [onMarkAsSeen, offer.id, offer.hasReviewed]);

  // Mark as seen when modal opens
  useEffect(() => {
    console.log('Modal effect triggered:', { isOpen, hasReviewed: offer.hasReviewed, hasOnMarkAsSeen: !!onMarkAsSeen });
    if (isOpen && !offer.hasReviewed && onMarkAsSeen) {
      console.log('Calling handleMarkAsSeen for offer:', offer.id);
      handleMarkAsSeen();
    }
  }, [isOpen, offer.hasReviewed, onMarkAsSeen, handleMarkAsSeen, offer.id]);

  const statusConfig = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
    SENT: { label: "New!", color: "bg-blue-100 text-blue-800" },
    SEEN: { label: "Seen", color: "bg-green-100 text-green-800" },
    ACCEPTED: { label: "Accepted", color: "bg-green-100 text-green-800" },
    DECLINED: { label: "Declined", color: "bg-red-100 text-red-800" },
    EXPIRED: { label: "Expired", color: "bg-gray-100 text-gray-800" },
    WITHDRAWN: { label: "Withdrawn", color: "bg-gray-100 text-gray-800" },
  };

  const statusInfo = statusConfig[offer.status as keyof typeof statusConfig] || statusConfig.SENT;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{offer.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {offer.description || "No description provided"}
            </p>
          </div>

          {/* Tags */}
          {offer.tags && offer.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {offer.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Valid Until */}
          {offer.validUntil && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Valid Until</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(offer.validUntil), "PPP 'at' p")}</span>
              </div>
            </div>
          )}

          {/* Media Files */}
          <MediaPreview media={offer.media || []} />

          {/* Discussion Rooms */}
          <RoomsSection rooms={offer.rooms} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {offer.rooms && offer.rooms.length > 0 && (
              <Link href={`/messages?room=${offer.rooms[0].id}`}>
                <Button>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Discussion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EnhancedOfferModal.displayName = 'EnhancedOfferModal';
