"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, User, Mail, Save, Loader2 } from "lucide-react";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";

interface AdminProfileFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  };
}

export function AdminProfileForm({ user }: AdminProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFile: uploadAvatar,
    isUploading: isUploadingAvatar,
    previewUrl,
  } = useAvatarUpload();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Please select an image smaller than 5MB.");
      return;
    }

    try {
      const result = await uploadAvatar(file);

      if (result) {
        // The upload API returns data with either 'url' or 'secure_url' property
        // For Cloudinary: secure_url, for local: url
        const avatarUrl = result.url;

        if (!avatarUrl) {
          console.error("No URL found in result:", result);
          toast.error("Upload successful but no URL returned.");
          return;
        }

        // Update the user's avatar in the database
        const response = await fetch("/api/admin/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            avatar: avatarUrl,
          }),
        });

        if (response.ok) {
          toast.success("Avatar updated successfully.");
        } else {
          toast.error("Avatar uploaded but failed to save to profile.");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = previewUrl || user.avatar;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Picture
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={currentAvatar || ""}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="text-lg">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to change your profile picture
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Personal Information
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={user.role.replace(/_/g, " ")}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Your role cannot be changed
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({
              firstName: user.firstName,
              lastName: user.lastName,
            });
          }}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
