"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaFile } from "@/types/models";
import {
  X,
  FileText,
  Image,
  Video,
  File,
  Download,
  Eye,
} from "lucide-react";

interface FilePreviewProps {
  file: MediaFile;
  index: number;
  onRemove: (index: number) => void;
  showActions?: boolean;
  size?: "sm" | "md" | "lg";
}

export function FilePreview({ 
  file, 
  index, 
  onRemove, 
  showActions = true,
  size = "md" 
}: FilePreviewProps) {
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "pdf":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "w-16 h-16",
          icon: "w-6 h-6",
          text: "text-xs",
        };
      case "lg":
        return {
          container: "w-24 h-24",
          icon: "w-10 h-10",
          text: "text-sm",
        };
      default: // md
        return {
          container: "w-20 h-20",
          icon: "w-8 h-8",
          text: "text-xs",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const renderPreview = () => {
    switch (file.type) {
      case 'image':
        return (
          <div className="relative group">
            <img
              src={file.url}
              alt={file.name || 'Preview'}
              className={`${sizeClasses.container} object-cover rounded-lg border border-border`}
              onClick={() => handlePreview(file)}
            />
          </div>
        );
      case 'video':
        return (
          <div className="relative group">
            <video
              src={file.url}
              className={`${sizeClasses.container} object-cover rounded-lg border border-border`}
              muted
              onClick={() => handlePreview(file)}
            />
          </div>
        );
      case 'pdf':
        return (
          <div 
            className={`${sizeClasses.container} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors`}
            onClick={() => handlePreview(file)}
          >
            <FileText className={`${sizeClasses.icon} text-red-600 dark:text-red-400`} />
            <span className={`${sizeClasses.text} text-red-600 dark:text-red-400 mt-1`}>PDF</span>
          </div>
        );
      default:
        return (
          <div className={`${sizeClasses.container} bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center`}>
            {getFileIcon(file.type)}
            <span className={`${sizeClasses.text} text-gray-600 dark:text-gray-400 mt-1 text-center px-1`}>
              {file.type.toUpperCase()}
            </span>
          </div>
        );
    }
  };

  return (
    <>
      <div className="relative group">
        {renderPreview()}
        <div className="mt-2 space-y-1">
          <p className={`${sizeClasses.text} font-medium text-foreground truncate max-w-[80px]`} title={file.name}>
            {file.name || 'Unknown file'}
          </p>
          <p className={`${sizeClasses.text} text-muted-foreground`}>
            {formatFileSize(file.size)}
          </p>
        </div>
        {showActions && (
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
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onRemove(index)}
              title="Remove"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] w-full relative">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">
                {previewFile.name || 'File Preview'}
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
              {previewFile.type === 'image' && (
                <img
                  src={previewFile.url}
                  alt={previewFile.name || 'Preview'}
                  className="max-w-full max-h-full object-contain mx-auto"
                />
              )}
              {previewFile.type === 'video' && (
                <video
                  src={previewFile.url}
                  controls
                  className="max-w-full max-h-full mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {previewFile.type === 'pdf' && (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[70vh] border-0 rounded"
                  title={previewFile.name || 'PDF Preview'}
                />
              )}
              {previewFile.type !== 'image' && previewFile.type !== 'video' && previewFile.type !== 'pdf' && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  {getFileIcon(previewFile.type)}
                  <p className="mt-2 text-lg font-medium">{previewFile.type.toUpperCase()}</p>
                  <p className="text-sm">Preview not available for this file type</p>
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
