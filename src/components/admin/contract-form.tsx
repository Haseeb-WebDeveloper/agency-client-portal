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

const serviceTags = [
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
    value: contract?.value || "",
    currency: contract?.currency || "USD",
    budget: contract?.budget || "",
    priority: contract?.priority || 3,
    estimatedHours: contract?.estimatedHours || "",
    selectedTags: contract?.tags || serviceTags.slice(0, 3),
  });

  const { uploadFiles, removeFile, isUploading, uploadedFiles } = useFileUpload(
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
    if (contract?.media) {
      // Convert existing media to uploaded files format
      const existingFiles = contract.media.map((file, index) => ({
        url: file.url,
        type: file.type,
        name: file.name || `File ${index + 1}`,
        size: file.size || 0,
      }));
      // Note: This would need to be handled by the useFileUpload hook
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

    // Validate financial values
    if (formData.value && parseFloat(formData.value.toString()) < 0) {
      alert("Contract value cannot be negative");
      return;
    }

    if (formData.budget && parseFloat(formData.budget.toString()) < 0) {
      alert("Budget cannot be negative");
      return;
    }

    try {
      const contractData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value.toString()) : null,
        budget: formData.budget ? parseFloat(formData.budget.toString()) : null,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours.toString()) : null,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        tags: formData.selectedTags,
        media: uploadedFiles.length > 0 ? uploadedFiles : null,
      };

      await onSave(contractData);
    } catch (error) {
      console.error("Error saving contract:", error);
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
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
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
                onValueChange={(value) => handleInputChange("priority", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
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
                onChange={(e) => handleInputChange("estimatedHours", e.target.value)}
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
            <Label htmlFor="value">Contract Value</Label>
            <div className="flex gap-2">
              <div className="w-24">
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

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
        <div>
          <div className="flex flex-wrap gap-2">
            {serviceTags.map((tag) => (
              <Badge
                key={tag}
                variant={
                  formData.selectedTags.includes(tag) ? "default" : "outline"
                }
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Project Assets */}
      <div className="p-6 rounded-lg border border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-4">Project Assets</h3>
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
          {isLoading ? "Saving..." : contract ? "Update Contract" : "Create Contract"}
        </Button>
      </div>
    </form>
  );
}
