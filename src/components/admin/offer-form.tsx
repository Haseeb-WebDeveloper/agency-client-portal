"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFileUpload } from "@/hooks/use-file-upload";
import { MediaFile } from "@/types/models";
import { FilePreview } from "@/components/shared/file-preview";
import {
  Calendar,
  X,
  UploadIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";

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
    tags: string[];
    media: MediaFile[] | null;
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

// Predefined service tags for suggestions
const suggestedServiceTags = [
  "Copywriting",
  "Graphic design",
  "Lead gen",
  "SEO",
  "Social media",
  "Web development",
  "Branding",
  "Content creation",
  "Email marketing",
  "PPC advertising",
  "Video production",
  "Photography",
  "Analytics",
];

// Custom Tag Input Component
interface CustomTagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  maxTags?: number;
}

function CustomTagInput({ 
  tags, 
  onTagsChange, 
  suggestions, 
  placeholder = "Type to add tags...",
  maxTags = 10 
}: CustomTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        !tags.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onTagsChange([...tags, tag]);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-1 border border-input rounded-md min-h-[40px]">
        {tags.map((tag, index) => (
          <Badge
            key={index}
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
          disabled={tags.length >= maxTags}
        />
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {tags.length >= maxTags && (
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}

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
    createRoom: !!offer?.room,
    roomName: offer?.room?.name || (offer?.title ? `Proposal: ${offer.title}` : ""),
    roomLogo: offer?.room?.logo || null,
    roomLogoFile: null as File | null,
    isUploadingRoomLogo: false,
    selectedTags: offer?.tags || [],
  });

  // Tags state for custom tag input
  const [tags, setTags] = useState<string[]>(offer?.tags || []);

  // Handle tags change
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    setFormData((prev) => ({
      ...prev,
      selectedTags: newTags,
    }));
  };

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
  }, [offer]);

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
        tags: formData.selectedTags,
        media: uploadedFiles.length > 0 ? uploadedFiles : null,
        messaging: {
          createRoom: formData.createRoom,
          roomName: formData.roomName || `Proposal: ${formData.title}`,
          roomLogo: formData.roomLogo || null,
        },
      };

      await onSave(offerData);
    } catch (error) {
      console.error("Error saving proposal:", error);
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
              Proposal Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Instagram Ad Campaign"
              required
              className="bg-transparent"
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
              placeholder="Describe the proposal details..."
              rows={4}
              className="bg-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientId" className="figma-paragraph">
                Client *
              </Label>
              <Select
                value={formData.clientId || ""}
                onValueChange={(value) => handleInputChange("clientId", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        {client.logo && (
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={client.logo} alt={client.name} />
                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <span>{client.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>
      </div>

      {/* Messaging Room */}
      <div className="">
        <p className="mb-4 text-lg">Proposal Room</p>
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
              Create a discussion room for this Proposal
            </Label>
          </div>
          {formData.createRoom && (
            <div className="flex gap-6 items-center">
              {/* Room Logo Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {formData.roomLogo ? (
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                      <AvatarImage
                        src={formData.roomLogo}
                        alt="Room logo preview"
                        className="w-20 h-20 object-cover rounded-full"
                      />
                      <AvatarFallback>
                        {formData.roomName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
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
                        <ImageIcon className="w-8 h-8 text-red-500" />
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
                  className="bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Tags */}
      <div className="">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          Service Tags
        </h3>
        <div className="space-y-2">
          <Label htmlFor="service-tags">Add service tags (type to create custom tags)</Label>
          <CustomTagInput
            tags={tags}
            onTagsChange={handleTagsChange}
            suggestions={suggestedServiceTags}
            placeholder="Type to add custom tags or select from suggestions..."
            maxTags={10}
          />
          <p className="text-sm text-muted-foreground">
            You can select from suggested tags or type to create custom ones. Press Enter or comma to add a tag.
          </p>
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
              Upload files to attach to this Proposal
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
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {uploadedFiles.map((file, index) => (
                  <FilePreview 
                    key={index} 
                    file={file} 
                    index={index} 
                    onRemove={removeFile}
                    showActions={true}
                    size="md"
                  />
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
          {isLoading ? "Saving..." : offer ? "Update Proposal" : "Create Proposal"}
        </Button>
      </div>

    </form>
  );
}
