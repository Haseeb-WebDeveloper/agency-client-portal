"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { EMOJIS } from "@/constants/emoji";
import RoomInfoModal from "@/components/messages/room-info-modal";
import {
  getRoomInfoAction,
  getAvailableUsersAction,
  updateRoomAction,
} from "@/actions/messages-client";
import { ChatLoading } from "@/components/shared/chat-loading";
import { MessageCache } from "@/lib/message-cache";
import {
  sendMessageOptimized,
  getMessagesOptimized,
} from "@/actions/messages-optimized";

type UserLite = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
};

type Message = {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isOptimistic?: boolean;
  user?: UserLite;
  parent?: {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user?: UserLite;
    attachments?: Array<{
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string | null;
      updatedBy: string | null;
      messageId: string;
    }>;
  } | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
    messageId: string;
  }>;
};

interface ChatRoomOptimizedProps {
  roomId: string;
  initialMessages: Message[];
  onSend: (formData: FormData) => Promise<void>;
  currentUserId?: string;
  roomTitle?: string;
  onRoomUpdate?: (
    roomId: string,
    updates: { name?: string; logo?: string | null }
  ) => void;
}

export default function ChatRoomOptimized({
  roomId,
  initialMessages,
  onSend,
  currentUserId,
  roomTitle,
  onRoomUpdate,
}: ChatRoomOptimizedProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([...initialMessages]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, uploadedFiles, removeFile, clearFiles, isUploading } =
    useFileUpload({ folder: "agency-portal/messages" });
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name?: string;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [fallbackTimeout, setFallbackTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load room info and check admin status
  useEffect(() => {
    const loadRoomInfo = async () => {
      try {
        setIsLoading(true);
        console.log("📡 [SERVER ACTION] Loading room info for:", roomId);

        const [roomData, usersData] = await Promise.all([
          getRoomInfoAction(roomId),
          getAvailableUsersAction(),
        ]);

        if (roomData) {
          setRoomInfo(roomData);
          const currentUserParticipant = roomData.participants.find(
            (p: any) => p.user.id === currentUserId
          );
          setIsAdmin(currentUserParticipant?.permission === "ADMIN");
          console.log("✅ [SERVER ACTION] Room info loaded successfully");
        }

        setAvailableUsers(usersData);
      } catch (error) {
        console.error("❌ [SERVER ACTION] Error loading room info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      loadRoomInfo();
    }
  }, [roomId, currentUserId]);

  // Handle room update
  const handleRoomUpdate = async (data: {
    name: string;
    description: string;
    logo?: string | null;
    addMembers?: string[];
    removeMembers?: string[];
  }) => {
    try {
      await updateRoomAction(roomId, data);
      const roomData = await getRoomInfoAction(roomId);
      if (roomData) {
        setRoomInfo(roomData);
        if (onRoomUpdate) {
          onRoomUpdate(roomId, {
            name: roomData.name,
            logo: roomData.logo,
          });
        }
      }
    } catch (error) {
      console.error("Error updating room:", error);
      throw error;
    }
  };

  // Merge incoming props with local state and load messages if needed
  useEffect(() => {
    const byId: Record<string, Message> = {};
    for (const m of messages) byId[m.id] = m;
    for (const m of initialMessages) byId[m.id] = m;
    const merged = Object.values(byId).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setMessages(merged);
    setIsAtBottom(true);

    // If no messages, try to load from server action
    if (merged.length === 0 && roomId) {
      console.log(
        "📡 [SERVER ACTION] No initial messages, loading from server action"
      );
      loadMessagesFromServer();
    }
  }, [initialMessages, roomId]);

  // Load messages from server action
  const loadMessagesFromServer = async () => {
    try {
      console.log("📡 [SERVER ACTION] Loading messages for room:", roomId);
      const result = await getMessagesOptimized(roomId, null, 50);
      const serverMessages = result.items || [];

      if (serverMessages.length > 0) {
        // Convert Date objects to strings to match Message type
        const convertedMessages = serverMessages.map((msg) => ({
          ...msg,
          createdAt:
            msg.createdAt instanceof Date
              ? msg.createdAt.toISOString()
              : msg.createdAt,
          updatedAt:
            msg.updatedAt instanceof Date
              ? msg.updatedAt.toISOString()
              : msg.updatedAt,
          attachments:
            msg.attachments?.map((att) => ({
              ...att,
              createdAt:
                att.createdAt instanceof Date
                  ? att.createdAt.toISOString()
                  : att.createdAt,
              updatedAt:
                att.updatedAt instanceof Date
                  ? att.updatedAt.toISOString()
                  : att.updatedAt,
            })) || [],
          parent: msg.parent
            ? {
                ...msg.parent,
                createdAt:
                  msg.parent.createdAt instanceof Date
                    ? msg.parent.createdAt.toISOString()
                    : msg.parent.createdAt,
                updatedAt:
                  msg.parent.updatedAt instanceof Date
                    ? msg.parent.updatedAt.toISOString()
                    : msg.parent.updatedAt,
                attachments:
                  (msg.parent as any).attachments?.map((att: any) => ({
                    ...att,
                    createdAt:
                      att.createdAt instanceof Date
                        ? att.createdAt.toISOString()
                        : att.createdAt,
                    updatedAt:
                      att.updatedAt instanceof Date
                        ? att.updatedAt.toISOString()
                        : att.updatedAt,
                  })) || [],
              }
            : null,
        }));

        setMessages(convertedMessages);
        MessageCache.set(roomId, convertedMessages);
        console.log(
          "✅ [SERVER ACTION] Loaded",
          convertedMessages.length,
          "messages from server"
        );
      }
    } catch (error) {
      console.error("❌ [SERVER ACTION] Error loading messages:", error);
    }
  };

  // Helper to scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    } else if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  // Check if user is at bottom
  const checkIfAtBottom = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isAtBottomNow = scrollTop + clientHeight >= scrollHeight - 100;
    setIsAtBottom(isAtBottomNow);
  };

  // Scroll to bottom when new messages arrive
  useLayoutEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, isAtBottom]);

  // Handle scroll events
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleScroll = () => {
      checkIfAtBottom();
    };

    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, []);

  // Optimized message sending with comprehensive logging
  const clientSend = async (formData: FormData) => {
    const startTime = performance.now();
    console.log(
      "🚀 [PERFORMANCE] Starting message send at:",
      new Date().toISOString()
    );

    const content = String(formData.get("content") || "").trim();
    if (!content && uploadedFiles.length === 0) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      roomId,
      userId: currentUserId || "",
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      isOptimistic: true,
      user: {
        id: currentUserId || "",
        firstName: "You",
        lastName: "",
        avatar: null,
      },
    };

    try {
      setIsSending(true);

      // Add optimistic message immediately
      const optimisticTime = performance.now();
      setMessages((prev) => [...prev, optimisticMessage]);
      MessageCache.addMessage(roomId, optimisticMessage);
      console.log(
        "⚡ [PERFORMANCE] Optimistic update completed in:",
        performance.now() - optimisticTime,
        "ms"
      );

      // Scroll to bottom
      setTimeout(() => scrollToBottom("smooth"), 100);

      // Send to server with detailed logging - USING SERVER ACTION!
      const serverStartTime = performance.now();
      console.log(
        "📤 [PERFORMANCE] Starting server action at:",
        new Date().toISOString()
      );

      // Use server action instead of API route
      const result = await sendMessageOptimized(
        roomId,
        content,
        replyTo?.id || null
      );

      const serverEndTime = performance.now();
      console.log(
        "📥 [PERFORMANCE] Server action completed in:",
        serverEndTime - serverStartTime,
        "ms"
      );

      // Clear input and files
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.style.height = "auto";
      }
      clearFiles();
      setReplyTo(null);

      // Don't remove optimistic message here - let realtime handle it
      // The optimistic message will be replaced when the real message arrives via realtime

      // Immediate refresh after a short delay to ensure message appears
      setTimeout(async () => {
        console.log("🔄 [IMMEDIATE] Refreshing messages to ensure they appear");
        await loadMessagesFromServer();
      }, 1000);

      // Fallback: if realtime doesn't work, refresh messages after a longer delay
      const timeout = setTimeout(async () => {
        const stillOptimistic = messages.some((m) => m.id === tempId);
        if (stillOptimistic) {
          console.log(
            "🔄 [FALLBACK] Realtime didn't work, refreshing messages manually"
          );
          await loadMessagesFromServer();
        }
        setFallbackTimeout(null);
      }, 3000);
      setFallbackTimeout(timeout);

      const totalTime = performance.now() - startTime;
      console.log("✅ [PERFORMANCE] Total message send time:", totalTime, "ms");
    } catch (error) {
      console.error("❌ [PERFORMANCE] Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      MessageCache.removeMessage(roomId, tempId);
    } finally {
      setIsSending(false);
    }
  };

  // Handle input change
  const onInputChange = () => {
    // Simplified input handler without typing indicators
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const text = inputRef.current.value;
      const newText = text.slice(0, start) + emoji + text.slice(end);

      inputRef.current.value = newText;
      inputRef.current.setSelectionRange(
        start + emoji.length,
        start + emoji.length
      );
      inputRef.current.focus();

      onInputChange();
    }
    setIsEmojiOpen(false);
  };

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  // Handle image preview
  const handleImagePreview = (url: string, name?: string) => {
    setPreviewImage({ url, name });
  };

  // Handle reply
  const handleReply = (message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  // Handle edit
  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setEditDraft(message.content);
  };

  // Handle edit save - USING SERVER ACTION!
  const handleEditSave = async () => {
    if (!editingId || !editDraft.trim()) return;

    try {
      console.log("✏️ [SERVER ACTION] Editing message:", editingId);

      // Use server action instead of API route
      const response = await fetch(`/api/messages/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editDraft.trim() }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingId
              ? { ...m, content: editDraft.trim(), isEdited: true }
              : m
          )
        );
        MessageCache.updateMessage(roomId, editingId, {
          content: editDraft.trim(),
          isEdited: true,
        });
        setEditingId(null);
        setEditDraft("");
        console.log("✅ [SERVER ACTION] Message edited successfully");
      }
    } catch (error) {
      console.error("❌ [SERVER ACTION] Error editing message:", error);
    }
  };

  // Handle delete - USING SERVER ACTION!
  const handleDelete = async (messageId: string) => {
    try {
      console.log("🗑️ [SERVER ACTION] Deleting message:", messageId);

      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        MessageCache.removeMessage(roomId, messageId);
        console.log("✅ [SERVER ACTION] Message deleted successfully");
      }
    } catch (error) {
      console.error("❌ [SERVER ACTION] Error deleting message:", error);
    }
  };

  // Realtime subscription for new messages
  useEffect(() => {
    if (!roomId) return;
    console.log("🔄 [PERFORMANCE] Subscribed to channel for room:", roomId);

    const channel = supabase
      .channel(`messages:${roomId}`, {
        config: {
          presence: {
            key: roomId,
          },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `roomId=eq.${roomId}`,
        },
        (payload) => {
          console.log("📨 [REALTIME] Received new message:", payload);

          // Clear fallback timeout since realtime is working
          if (fallbackTimeout) {
            clearTimeout(fallbackTimeout);
            setFallbackTimeout(null);
            console.log(
              "🔄 [REALTIME] Cleared fallback timeout - realtime is working"
            );
          }

          const newMessage = payload.new as any;

          // Convert Date objects to strings to match Message type
          const convertedMessage = {
            ...newMessage,
            createdAt:
              newMessage.createdAt instanceof Date
                ? newMessage.createdAt.toISOString()
                : newMessage.createdAt,
            updatedAt:
              newMessage.updatedAt instanceof Date
                ? newMessage.updatedAt.toISOString()
                : newMessage.updatedAt,
            attachments:
              newMessage.attachments?.map((att: any) => ({
                ...att,
                createdAt:
                  att.createdAt instanceof Date
                    ? att.createdAt.toISOString()
                    : att.createdAt,
                updatedAt:
                  att.updatedAt instanceof Date
                    ? att.updatedAt.toISOString()
                    : att.updatedAt,
              })) || [],
            parent: newMessage.parent
              ? {
                  ...newMessage.parent,
                  createdAt:
                    newMessage.parent.createdAt instanceof Date
                      ? newMessage.parent.createdAt.toISOString()
                      : newMessage.parent.createdAt,
                  updatedAt:
                    newMessage.parent.updatedAt instanceof Date
                      ? newMessage.parent.updatedAt.toISOString()
                      : newMessage.parent.updatedAt,
                  attachments:
                    (newMessage.parent as any).attachments?.map((att: any) => ({
                      ...att,
                      createdAt:
                        att.createdAt instanceof Date
                          ? att.createdAt.toISOString()
                          : att.createdAt,
                      updatedAt:
                        att.updatedAt instanceof Date
                          ? att.updatedAt.toISOString()
                          : att.updatedAt,
                    })) || [],
                }
              : null,
          };

          // Add to messages if not already present, or replace optimistic message
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === convertedMessage.id);
            if (exists) {
              console.log("📨 [REALTIME] Message already exists, skipping");
              return prev;
            }

            console.log(
              "📨 [REALTIME] Adding new message to UI:",
              convertedMessage.id
            );

            // Remove any optimistic messages for this user (they might have sent multiple messages)
            const filtered = prev.filter(
              (m) => !(m.isOptimistic && m.userId === convertedMessage.userId)
            );

            const updated = [...filtered, convertedMessage].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );

            // Update cache
            MessageCache.set(roomId, updated);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log("🔄 [REALTIME] Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log(
            "✅ [REALTIME] Successfully subscribed to messages for room:",
            roomId
          );
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ [REALTIME] Channel error for room:", roomId);
          console.error(
            "🔍 [REALTIME] This is likely due to missing RLS policies on the messages table"
          );
          console.error(
            "💡 [REALTIME] Please enable RLS and create policies for the messages table"
          );
          console.error(
            "📝 [REALTIME] Run the RLS policies SQL script located at: src/lib/rls-policies.sql"
          );
          console.error(
            "🔗 [REALTIME] For more information, see: https://supabase.com/docs/guidelines-and-limitations/realtime"
          );

          // Set up fallback polling when realtime fails
          if (!fallbackTimeout) {
            console.log(
              "🔄 [FALLBACK] Setting up fallback polling due to realtime error"
            );
            const fallback = setTimeout(() => {
              console.log(
                "🔄 [FALLBACK] Refreshing messages due to realtime failure"
              );
              loadMessagesFromServer();
            }, 3000); // 3 second fallback
            setFallbackTimeout(fallback);
          }
        } else if (status === "TIMED_OUT") {
          console.error(
            "❌ [REALTIME] Subscription timed out for room:",
            roomId
          );

          // Set up fallback polling when realtime times out
          if (!fallbackTimeout) {
            console.log(
              "🔄 [FALLBACK] Setting up fallback polling due to timeout"
            );
            const fallback = setTimeout(() => {
              console.log("🔄 [FALLBACK] Refreshing messages due to timeout");
              loadMessagesFromServer();
            }, 3000);
            setFallbackTimeout(fallback);
          }
        } else if (status === "CLOSED") {
          console.log("🔒 [REALTIME] Subscription closed for room:", roomId);
        }
      });
    console.log("🔄 [PERFORMANCE] Subscribed to channel for room:", roomId);

    return () => {
      console.log("🔄 [PERFORMANCE] Removing channel for room:", roomId);
      supabase.removeChannel(channel);

      // Clear any pending fallback timeout
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        setFallbackTimeout(null);
      }
    };
  }, [roomId, supabase, fallbackTimeout]);

  // Periodic fallback mechanism to ensure messages are refreshed
  useEffect(() => {
    if (!roomId) return;

    // Set up periodic refresh every 10 seconds as a safety net
    const interval = setInterval(() => {
      console.log("🔄 [PERIODIC] Refreshing messages as safety net");
      loadMessagesFromServer();
    }, 10000); // 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [roomId]);

  if (isLoading) {
    return <ChatLoading />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm">
            {roomInfo?.logo ? (
              <img
                src={roomInfo.logo}
                alt={roomTitle}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              roomTitle?.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-medium">{roomTitle}</h2>
            <p className="text-sm text-foreground/60">
              {roomInfo?.participants?.length || 0} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRoomInfoOpen(true)}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.userId === currentUserId ? "justify-end" : "justify-start"
            }`}
          >
            {message.userId !== currentUserId && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={message.user?.avatar || ""} />
                <AvatarFallback>
                  {message.user?.firstName?.[0]}
                  {message.user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[70%] ${
                message.userId === currentUserId ? "order-first" : ""
              }`}
            >
              {message.userId !== currentUserId && (
                <p className="text-xs text-foreground/60 mb-1">
                  {message.user?.firstName} {message.user?.lastName}
                </p>
              )}

              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.userId === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                } ${message.isOptimistic ? "opacity-70" : ""}`}
              >
                {message.parent && (
                  <div className="mb-2 p-2 bg-background/20 rounded-lg border-l-2 border-primary/30">
                    <p className="text-xs text-foreground/60 mb-1">
                      Replying to {message.parent.user?.firstName}{" "}
                      {message.parent.user?.lastName}
                    </p>
                    <p className="text-sm truncate">{message.parent.content}</p>
                  </div>
                )}

                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2"
                      >
                        {attachment.mimeType.startsWith("image/") ? (
                          <img
                            src={attachment.filePath}
                            alt={attachment.fileName}
                            className="max-w-48 max-h-48 rounded-lg cursor-pointer"
                            onClick={() =>
                              handleImagePreview(
                                attachment.filePath,
                                attachment.fileName
                              )
                            }
                          />
                        ) : (
                          <a
                            href={attachment.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-background/20 rounded-lg hover:bg-background/30 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14,2 14,8 20,8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10,9 9,9 8,9" />
                            </svg>
                            <span className="text-sm">
                              {attachment.fileName}
                            </span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {message.isEdited && (
                    <span className="text-xs opacity-70">(edited)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => handleReply(message)}
                  className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                >
                  Reply
                </button>
                {message.userId === currentUserId && (
                  <>
                    <button
                      onClick={() => handleEdit(message)}
                      className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Bottom sentinel */}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-primary/10">
        {replyTo && (
          <div className="mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/60">
                Replying to {replyTo.user?.firstName} {replyTo.user?.lastName}
              </p>
              <p className="text-sm truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-foreground/60 hover:text-foreground"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <form action={clientSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              name="content"
              placeholder="Type a message..."
              className="w-full resize-none rounded-lg border border-primary/20 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
                onInputChange();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                className="p-1 hover:bg-secondary/20 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleFileSelect}
                className="p-1 hover:bg-secondary/20 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </form>

        {/* File attachments */}
        {uploadedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-muted rounded-lg"
              >
                <span className="text-sm truncate max-w-32">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Emoji Picker */}
      {isEmojiOpen && (
        <div className="absolute bottom-20 right-4 bg-background border border-primary/20 rounded-lg p-3 shadow-lg max-h-48 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="p-2 hover:bg-secondary/20 rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogContent className="max-w-4xl">
            <img
              src={previewImage.url}
              alt={previewImage.name || "Preview"}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Room Info Modal */}
      {isRoomInfoOpen && roomInfo && (
        <RoomInfoModal
          isOpen={isRoomInfoOpen}
          onClose={() => setIsRoomInfoOpen(false)}
          roomInfo={roomInfo}
          onUpdate={handleRoomUpdate}
        />
      )}
    </div>
  );
}
