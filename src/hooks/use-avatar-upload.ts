import { useState } from 'react';
import { MediaFile } from '@/types/models';

interface UseAvatarUploadOptions {
  folder?: string;
  onSuccess?: (file: MediaFile) => void;
  onError?: (error: string) => void;
}

export function useAvatarUpload(options: UseAvatarUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<MediaFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const uploadFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    
    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string || '');
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const uploadedFileData = result.data;
      
      setUploadedFile(uploadedFileData);
      options.onSuccess?.(uploadedFileData);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options.onError?.(errorMessage);
      // Reset preview on error
      setPreviewUrl('');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setPreviewUrl('');
  };

  const setInitialFile = (file: MediaFile | null) => {
    setUploadedFile(file);
    setPreviewUrl(file?.url || '');
  };

  return {
    uploadFile,
    clearFile,
    setInitialFile,
    isUploading,
    uploadedFile,
    previewUrl,
  };
}
