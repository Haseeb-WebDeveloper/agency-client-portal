"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import { MediaFile } from "@/types/models";
import {
  Calendar,
  X,
  FileText,
  Image,
  Video,
  File,
  UploadIcon,
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
    room?: {
      id: string;
      name: string;
      logo?: string | null;
    } | null;
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
    status: "SENT",
    clientId: offer?.clientId || "",
    validUntil: offer?.validUntil
      ? new Date(offer.validUntil).toISOString().split("T")[0]
      : "",
    createRoom: !!offer?.room,
    roomName: offer?.room?.name || (offer?.title ? `Offer: ${offer.title}` : ""),
    roomLogo: offer?.room?.logo || null,
    roomLogoFile: null as File | null,
    isUploadingRoomLogo: false,
  });

  const { uploadFiles, removeFile, isUploading, uploadedFiles, setInitialFiles } = useFileUpload(
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
    if (offer?.media && Array.isArray(offer.media)) {
      // Convert existing media to uploaded files format
      const existingFiles = offer.media.map((file, index) => ({
        url: file.url,
        type: file.type,
        name: file.name || `File ${index + 1}`,
        size: file.size || 0,
      }));
      setInitialFiles(existingFiles);
    }
  }, [offer, setInitialFiles]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (formData.roomLogo && formData.roomLogo.startsWith("blob:")) {
        URL.revokeObjectURL(formData.roomLogo);
      }
    };
  }, [formData.roomLogo]);

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

  const handleRoomLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Set loading state
      setFormData((prev) => ({
        ...prev,
        roomLogoFile: file,
        roomLogo: URL.createObjectURL(file), // For preview
        isUploadingRoomLogo: true,
      }));

      try {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'offers/room-logos');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        
        // Update form data with Cloudinary URL
        setFormData((prev) => ({
          ...prev,
          roomLogo: result.data.url,
          roomLogoFile: file,
          isUploadingRoomLogo: false,
        }));
      } catch (error) {
        console.error('Room logo upload error:', error);
        alert('Failed to upload room logo. Please try again.');
        setFormData((prev) => ({
          ...prev,
          roomLogoFile: null,
          roomLogo: null,
          isUploadingRoomLogo: false,
        }));
      }
    }
  };

  const removeRoomLogo = () => {
    // Only revoke object URL if it's a blob URL (local preview)
    if (formData.roomLogo && formData.roomLogo.startsWith('blob:')) {
      URL.revokeObjectURL(formData.roomLogo);
    }
    setFormData((prev) => ({
      ...prev,
      roomLogoFile: null,
      roomLogo: null,
      isUploadingRoomLogo: false,
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
        messaging: {
          createRoom: formData.createRoom,
          roomName: formData.roomName || `Offer: ${formData.title}`,
          roomLogo: formData.roomLogo || null,
        },
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
      <div className="">
        <p className="mb-4 text-lg">Basic Information</p>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="figma-paragraph">
              Offer Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Instagram Ad Campaign"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="figma-paragraph">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the offer details..."
              rows={4}
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientId" className="figma-paragraph">
                Client *
              </Label>
              {/* Custom select instead of shadcn/ui Select */}
              <div className="relative">
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => handleInputChange("clientId", e.target.value)}
                  required
                  className="cursor-pointer block w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none appearance-none"
                  style={{ WebkitAppearance: "none", MozAppearance: "none", appearance: "none" }}
                >
                  <option value="" disabled>
                    Select a client
                  </option>
                  {clients.map((client) => (
                    <option className="cursor-pointer" key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown image (chevron) */}
                <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M6 8L10 12L14 8" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil" className="figma-paragraph">
                Valid Until
              </Label>
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
        </div>
      </div>

      {/* Messaging Room */}
      <div className="">
        <p className="mb-4 text-lg">Offer Room</p>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <input
              id="createRoom"
              type="checkbox"
              checked={formData.createRoom}
              onChange={(e) =>
                handleInputChange("createRoom", e.target.checked)
              }
            />
            <Label htmlFor="createRoom">
              Create a discussion room for this offer
            </Label>
          </div>
          {formData.createRoom && (
            <div className="flex gap-6 items-center">
              {/* Room Logo Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {formData.roomLogo ? (
                    <div className="relative">
                      <img
                        src={formData.roomLogo}
                        alt="Room logo preview"
                        className="w-20 h-20 object-cover rounded-full"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                        onClick={removeRoomLogo}
                        disabled={formData.isUploadingRoomLogo}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                        <Image className="w-8 h-8 text-red-500" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-600 text-white hover:bg-gray-700 p-0"
                        onClick={() =>
                          document.getElementById("room-logo-upload")?.click()
                        }
                        disabled={formData.isUploadingRoomLogo}
                      >
                        {formData.isUploadingRoomLogo ? (
                          <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <span className="text-sm">+</span>
                        )}
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleRoomLogoUpload}
                    className="hidden"
                    id="room-logo-upload"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Room Name Section */}
              <div className="space-y-2">
                <Label htmlFor="roomName" className="figma-paragraph">
                  Room Name
                </Label>
                <Input
                  id="roomName"
                  value={formData.roomName}
                  onChange={(e) =>
                    handleInputChange("roomName", e.target.value)
                  }
                  placeholder="Room Name"
                  className=""
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Assets */}
      <div className="">
        <p className="mb-4 text-lg">Project Assets</p>
        <div></div>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
            <UploadIcon className="w-8 h-8 mx-auto mb-2 text-primary/60" />
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
