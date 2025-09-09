"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFileUpload } from "@/hooks/use-file-upload";
import Image from "next/image";
import { X, Plus, Trash2 } from "lucide-react";

type RoomInfo = {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  type: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    role: string;
    permission: string;
  }>;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  role: string;
};

interface RoomInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomInfo: RoomInfo | null;
  onUpdate: (data: {
    name: string;
    description: string;
    logo?: string | null;
    addMembers?: string[];
    removeMembers?: string[];
  }) => Promise<void>;
  availableUsers?: User[];
  isAdmin?: boolean;
}

export default function RoomInfoModal({
  isOpen,
  onClose,
  roomInfo,
  onUpdate,
  availableUsers = [],
  isAdmin = false,
}: RoomInfoModalProps) {
  const [name, setName] = useState(roomInfo?.name || "");
  const [description, setDescription] = useState(roomInfo?.description || "");
  const [isPending, startTransition] = useTransition();
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const { uploadFiles, uploadedFiles, removeFile, clearFiles, isUploading } =
    useFileUpload({ folder: "agency-portal/rooms" });

  // Keep local fields in sync when a different room is opened or dialog toggles
  // This also fixes the issue where mobile showed an empty modal on first open
  React.useEffect(() => {
    setName(roomInfo?.name || "");
    setDescription(roomInfo?.description || "");
  }, [roomInfo, isOpen]);

  const handleSave = async () => {
    if (!roomInfo) return;

    startTransition(async () => {
      try {
        await onUpdate({
          name,
          description,
          logo: uploadedFiles[0]?.url || roomInfo.logo,
          addMembers: selectedUsers,
        });
        onClose();
      } catch (error) {
        console.error("Error updating room:", error);
      }
    });
  };

  const handleAddMember = (userId: string) => {
    setSelectedUsers(prev => [...prev, userId]);
  };

  const handleRemoveMember = (userId: string) => {
    if (roomInfo?.participants.length === 2) {
      // Don't allow removing the last member in a DM
      return;
    }
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const getInitials = (user: { firstName?: string; lastName?: string }) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  const filteredUsers = availableUsers.filter(
    user => !roomInfo?.participants.some(p => p.id === user.id) && 
             !selectedUsers.includes(user.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Room Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={uploadedFiles[0]?.url || roomInfo?.logo || ""} />
                <AvatarFallback className="text-lg">
                  {roomInfo?.name?.slice(0, 2).toUpperCase() || 'R'}
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 w-6 h-6 p-0 rounded-full"
                  onClick={() => document.getElementById('room-logo-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="mt-1"
              />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            id="room-logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                uploadFiles(Array.from(e.target.files));
              }
            }}
          />

          {/* Description */}
          <div>
            <Label htmlFor="room-description">Description</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isAdmin}
              placeholder="Add a description for this room..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Room Type */}
          <div>
            <Label>Room Type</Label>
            <Badge variant="secondary" className="mt-1">
              {roomInfo?.type?.replace('_', ' ').toLowerCase()}
            </Badge>
          </div>

          {/* Current Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Members ({roomInfo?.participants.length || 0})</Label>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMembers(!showAddMembers)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Members
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {roomInfo?.participants.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {member.permission.toLowerCase()}
                    </Badge>
                    {isAdmin && roomInfo.participants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Members Section */}
          {showAddMembers && (
            <div>
              <Label>Add New Members</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-foreground/5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName || ''} {user.lastName || ''}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {user.email || ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMember(user.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-foreground/60 text-center py-4">
                    No available users to add
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Selected Users to Add */}
          {selectedUsers.length > 0 && (
            <div>
              <Label>Selected to Add ({selectedUsers.length})</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = availableUsers.find(u => u.id === userId);
                  if (!user) return null;
                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {user.firstName || ''} {user.lastName || ''}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {isAdmin && (
              <Button
                onClick={handleSave}
                disabled={isPending || isUploading}
              >
                {isPending ? "Saving..." : isUploading ? "Uploading..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
