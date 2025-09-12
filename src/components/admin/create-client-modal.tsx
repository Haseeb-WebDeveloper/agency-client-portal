"use client";

import { useState, useRef } from "react";
import {
  X,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Pencil,
  User,
  Mail,
  Plus,
  Minus,
} from "lucide-react";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";

interface ClientMember {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isNew?: boolean;
}

interface CreateClientModalProps {
  onClose: () => void;
  onClientCreated: () => void;
}

interface ClientFormData {
  name: string;
  description: string;
  logo: string;
  email: string;
  firstName: string;
  lastName: string;
  clientMembers: ClientMember[];
}

const AVATAR_PLACEHOLDER =
  "https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=client";

export function CreateClientModal({
  onClose,
  onClientCreated,
}: CreateClientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    description: "",
    logo: "",
    email: "",
    firstName: "",
    lastName: "",
    clientMembers: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFile: uploadAvatar,
    clearFile: clearAvatar,
    isUploading: isUploadingAvatar,
    previewUrl: logoPreview,
  } = useAvatarUpload({
    folder: 'agency-portal/avatars',
    onSuccess: (file) => {
      setFormData((prev) => ({ ...prev, logo: file.url }));
    },
    onError: (error) => {
      setError(error);
    },
  });

  const getPayload = () => ({
    ...formData,
    website: "",
  });

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addClientMember = () => {
    const newMember: ClientMember = {
      firstName: "",
      lastName: "",
      email: "",
      role: "member",
      isNew: true,
    };
    setFormData((prev) => ({
      ...prev,
      clientMembers: [...prev.clientMembers, newMember],
    }));
  };

  const removeClientMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      clientMembers: prev.clientMembers.filter((_, i) => i !== index),
    }));
  };

  const updateClientMember = (index: number, field: keyof ClientMember, value: string) => {
    setFormData((prev) => ({
      ...prev,
      clientMembers: prev.clientMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      await uploadAvatar(file);
    } catch (err) {
      // Error is already handled by the hook's onError callback
    }
  };

  const handleLogoDelete = () => {
    clearAvatar();
    setFormData((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getPayload()),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create client");
      }

      onClientCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.clientMembers.every(member => 
      member.firstName.trim() !== "" && 
      member.lastName.trim() !== "" && 
      member.email.trim() !== ""
    );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#18132A] border border-[#2B2346] rounded-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B2346]">
          <h2 className="text-lg font-bold text-white">Create New Client</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 transition-colors"
            disabled={isLoading || isUploadingAvatar}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Company name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-base mb-2">
            <User className="w-4 h-4" />
              Company Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Company Name"
              className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base mb-2">
                <User className="w-4 h-4" />
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="First Name"
                className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-base mb-2">
                <User className="w-4 h-4" />
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Last Name"
                className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Email address */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
            <Mail className="w-4 h-4" />
              Email address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john@dashdark.com"
              className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Photo */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
              <ImageIcon className="w-4 h-4" />
              Photo
            </label>
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <img
                  src={logoPreview || AVATAR_PLACEHOLDER}
                  alt="Client logo"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#2B2346] bg-[#201A36]"
                />
                {/* Loading overlay */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  </div>
                )}
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                  disabled={isLoading || isUploadingAvatar}
                />
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-[#7C5CFA] transition-colors disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploadingAvatar}
                >
                  <Pencil className="w-4 h-4" />
                  {isUploadingAvatar ? "Uploading..." : "Change photo"}
                </button>
                {(logoPreview && logoPreview !== AVATAR_PLACEHOLDER) && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    onClick={handleLogoDelete}
                    disabled={isLoading || isUploadingAvatar}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Short description */}
          <div>
            <label className="flex items-center gap-2 text-base mb-2">
              <Pencil className="w-4 h-4" />
              Short description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Write a short bio about you..."
              rows={3}
              className="w-full bg-transparent border border-[#2B2346] rounded-lg px-4 py-2 placeholder:text-white/40 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Client Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                Client Members
              </label>
              <button
                type="button"
                onClick={addClientMember}
                className="flex items-center gap-2 text-sm text-[#7C5CFA] hover:text-[#6B42D1] transition-colors"
                disabled={isLoading || isUploadingAvatar}
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            {formData.clientMembers.length > 0 && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {formData.clientMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-[#201A36] border border-[#2B2346] rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        Member {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeClientMember(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        disabled={isLoading || isUploadingAvatar}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={member.firstName}
                          onChange={(e) => updateClientMember(index, "firstName", e.target.value)}
                          placeholder="First Name"
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={member.lastName}
                          onChange={(e) => updateClientMember(index, "lastName", e.target.value)}
                          placeholder="Last Name"
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateClientMember(index, "email", e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">
                          Role
                        </label>
                        <select
                          value={member.role}
                          onChange={(e) => updateClientMember(index, "role", e.target.value)}
                          className="w-full bg-transparent border border-[#2B2346] rounded px-3 py-2 text-sm focus:outline-none transition-all"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.clientMembers.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No additional members added yet</p>
                <p className="text-xs">Click "Add Member" to add team members</p>
              </div>
            )}
          </div>

          <hr className="border-[#2B2346] my-2" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={!isValid || isLoading || isUploadingAvatar}
              className="bg-[#7C5CFA] hover:bg-[#6B42D1] px-8 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed">
                  Create Client
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white/90 transition-colors px-2 py-2"
              disabled={isLoading || isUploadingAvatar}
            >
              Reset changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
  