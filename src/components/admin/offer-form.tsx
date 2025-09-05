"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFileUpload } from "@/hooks/use-file-upload";
import { MediaFile } from "@/types/models";
import {
  Calendar,
  Upload,
  X,
  FileText,
  Image,
  Video,
  File,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  logo?: string | null;
}

interface OfferFormProps {
  offer?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    media: MediaFile[] | null;
    validUntil: string | null;
    clientId: string;
  } | null;
  clients: Client[];
  onSave: (offerData: any) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const serviceTags = [
  "Copywriting",
  "Graphic design",
  "Lead gen",
  "SEO",
  "Social Media",
  "Web Development",
];

export function OfferForm({
  offer,
  clients,
  onSave,
  isLoading = false,
}: OfferFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: offer?.title || "",
    description: offer?.description || "",
    status: offer?.status || "DRAFT",
    clientId: offer?.clientId || "",
    validUntil: offer?.validUntil
      ? new Date(offer.validUntil).toISOString().split("T")[0]
      : "",
    selectedTags: serviceTags.slice(0, 3), // Default to first 3 tags
  });

  const { uploadFiles, removeFile, isUploading, uploadedFiles } = useFileUpload(
    {
      folder: "offers",
      onSuccess: (files) => {
        console.log("Files uploaded successfully:", files);
      },
      onError: (error) => {
        console.error("Upload error:", error);
      },
    }
  );

  // Initialize uploaded files from existing offer
  useEffect(() => {
    if (offer?.media) {
      // Convert existing media to uploaded files format
      const existingFiles = offer.media.map((file, index) => ({
        url: file.url,
        type: file.type,
        name: file.name || `File ${index + 1}`,
        size: file.size || 0,
      }));
      // Note: This would need to be handled by the useFileUpload hook
    }
  }, [offer]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFiles(Array.from(files));
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.clientId) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const offerData = {
        ...formData,
        media: uploadedFiles.length > 0 ? uploadedFiles : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
      };

      await onSave(offerData);
    } catch (error) {
      console.error("Error saving offer:", error);
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="p-4 rounded-lg border border-primary/20">
        <p className="mb-4">Basic Information</p>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Offer Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Instagram Ad Campaign"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleInputChange("clientId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  handleInputChange("validUntil", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the offer details..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Service Tags */}
      <div className="p-4 rounded-lg border border-primary/20">
          <p className="mb-4">Service Tags</p>
        <div>
          <div className="flex flex-wrap gap-2">
            {serviceTags.map((tag) => (
              <Badge
                key={tag}
                variant={
                  formData.selectedTags.includes(tag) ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Project Assets */}
      <div className="p-4 rounded-lg border border-primary/20">
        <p className="mb-4">Project Assets</p>
        <div>
        </div>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary/60" />
            <p className="text-sm text-foreground/60 mb-4">
              Upload files to attach to this offer
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                Uploaded Files
              </h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-primary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-foreground/60 capitalize">
                          {file.type} •{" "}
                          {file.size
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : "Unknown size"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isUploading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? "Saving..." : offer ? "Update Offer" : "Create Offer"}
        </Button>
      </div>
    </form>
  );
}
