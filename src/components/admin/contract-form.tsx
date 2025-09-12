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
import { FilePreview } from "@/components/shared/file-preview";
import {
  Calendar,
  Upload,
  X,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  logo?: string | null;
}

interface ContractFormProps {
  contract?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    tags: string[];
    clientId: string;
    startDate: string | null;
    endDate: string | null;
    value: number | null;
    currency: string;
    budget: number | null;
    priority: number;
    estimatedHours: number | null;
    media: MediaFile[];
  } | null;
  clients: Client[];
  onSave: (contractData: any) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "EXPIRED", label: "Expired" },
];

const priorityOptions = [
  { value: 1, label: "High" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Low" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
];

// Predefined service tags for suggestions
const suggestedServiceTags = [
  "Copywriting",
  "Graphic design",
  "Lead gen",
  "SEO",
  "Social Media",
  "Web Development",
  "Branding",
  "Marketing Strategy",
  "Content Creation",
  "Email Marketing",
  "PPC Advertising",
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
    // Add tag if there's input value
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
    setShowSuggestions(false);
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
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
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

export function ContractForm({
  contract,
  clients,
  onSave,
  isLoading = false,
}: ContractFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: contract?.title || "",
    description: contract?.description || "",
    status: contract?.status || "DRAFT",
    clientId: contract?.clientId || "",
    startDate: contract?.startDate
      ? new Date(contract.startDate).toISOString().split("T")[0]
      : "",
    endDate: contract?.endDate
      ? new Date(contract.endDate).toISOString().split("T")[0]
      : "",
    currency: contract?.currency || "USD",
    budget: contract?.budget || "",
    priority: contract?.priority || 3,
    estimatedHours: contract?.estimatedHours || "",
    selectedTags: contract?.tags || [],
  });

  // Tags state for custom tag input
  const [tags, setTags] = useState<string[]>(contract?.tags || []);

  const { uploadFiles, removeFile, isUploading, uploadedFiles, setInitialFiles } = useFileUpload(
    {
      folder: "contracts",
      onSuccess: (files) => {
        console.log("Files uploaded successfully:", files);
      },
      onError: (error) => {
        console.error("Upload error:", error);
      },
    }
  );

  // Initialize uploaded files from existing contract
  useEffect(() => {
    if (contract?.media && Array.isArray(contract.media)) {
      // Convert existing media to uploaded files format
      const existingFiles = contract.media.map((file, index) => ({
        url: file.url,
        type: file.type,
        name: file.name || `File ${index + 1}`,
        size: file.size || 0,
      }));
      setInitialFiles(existingFiles);
    }
  }, [contract]);

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

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    setFormData((prev) => ({
      ...prev,
      selectedTags: newTags,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.clientId) {
      alert("Please fill in all required fields (Title and Client)");
      return;
    }

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        alert("End date must be after start date");
        return;
      }
    }

    if (formData.budget && parseFloat(formData.budget.toString()) < 0) {
      alert("Budget cannot be negative");
      return;
    }

    try {
      const contractData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget.toString()) : null,
        estimatedHours: formData.estimatedHours
          ? parseInt(formData.estimatedHours.toString())
          : null,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        tags: formData.selectedTags,
        media: uploadedFiles.length > 0 ? uploadedFiles : (contract?.media || []),
      };

      await onSave(contractData);
    } catch (error) {
      console.error("Error saving contract:", error);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Basic Information
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Contract Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Social Media Management"
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
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  handleInputChange("priority", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the contract details and scope of work..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Dates & Timeline */}
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timeline & Duration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) =>
                  handleInputChange("estimatedHours", e.target.value)
                }
                placeholder="e.g., 40"
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Financial Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => handleInputChange("budget", e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Service Tags */}
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
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
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Project Assets
        </h3>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary/60" />
            <p className="text-sm text-foreground/60 mb-4">
              Upload files to attach to this contract
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
          {isLoading
            ? "Saving..."
            : contract
            ? "Update Contract"
            : "Create Contract"}
        </Button>
      </div>
    </form>
  );
}
