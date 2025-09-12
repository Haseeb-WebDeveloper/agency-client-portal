"use client";

import { useState, useEffect, useCallback } from 'react';

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

interface UseLazyMediaOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useLazyMedia(
  media: MediaFile[] | null,
  options: UseLazyMediaOptions = {}
) {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const loadMedia = useCallback((mediaId: string) => {
    setLoadedMedia(prev => new Set(prev).add(mediaId));
  }, []);

  const preloadMedia = useCallback((media: MediaFile[]) => {
    media.forEach(file => {
      const fileId = file.id || file.fileName || file.name || 'unknown';
      const mimeType = file.mimeType || (file.type === 'image' ? 'image/jpeg' : 
                    file.type === 'video' ? 'video/mp4' : 
                    file.type === 'pdf' ? 'application/pdf' : 
                    file.type === 'document' ? 'application/msword' : 
                    'application/octet-stream');
      const url = file.url || file.src || file.path;
      
      if (mimeType.startsWith('image/') && url) {
        const img = new Image();
        img.src = url;
        img.onload = () => loadMedia(fileId);
        img.onerror = () => loadMedia(fileId); // Still mark as loaded even if failed
      } else {
        // For non-image files, just mark as loaded
        loadMedia(fileId);
      }
    });
  }, [loadMedia]);

  useEffect(() => {
    if (isIntersecting && media && media.length > 0) {
      preloadMedia(media);
    }
  }, [isIntersecting, media, preloadMedia]);

  return {
    loadedMedia,
    isIntersecting,
    observerRef,
    loadMedia,
  };
}
