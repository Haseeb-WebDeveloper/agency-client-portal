import { useState, useCallback } from 'react';
import { MediaFile } from '@/types/models';

interface UseFileUploadOptions {
  folder?: string;
  onSuccess?: (files: MediaFile[]) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises: Promise<MediaFile>[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        if (options.folder) {
          formData.append('folder', options.folder);
        }

        const uploadPromise = fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('Upload failed');
            }
            const result = await response.json();
            return result.data;
          });

        uploadPromises.push(uploadPromise);
      }

      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);
      options.onSuccess?.(results);
    } catch (error) {
      console.error('Upload error:', error);
      options.onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setUploadedFiles([]);
  };

  const setInitialFiles = useCallback((files: MediaFile[]) => {
    setUploadedFiles(files);
  }, []);

  return {
    uploadFiles,
    removeFile,
    clearFiles,
    setInitialFiles,
    isUploading,
    uploadedFiles,
  };
}
