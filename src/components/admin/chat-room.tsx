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
  isEdited: boolean;
  user?: UserLite;
  parent?: {
    id: string;
    content: string;
    user?: UserLite;
    attachments?: Array<{
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    }>;
  } | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }>;
};

interface ChatRoomProps {
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

export default function ChatRoom({
  roomId,
  initialMessages,
  onSend,
  currentUserId,
  roomTitle,
  onRoomUpdate,
}: ChatRoomProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([...initialMessages]);
  const [typingUsers, setTypingUsers] = useState<
    Record<string, { name: string; at: number }>
  >({});
  const [isPending, startTransition] = useTransition();
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Load room info and check admin status
  useEffect(() => {
    const loadRoomInfo = async () => {
      try {
        setIsLoading(true);
        const [roomData, usersData] = await Promise.all([
          getRoomInfoAction(roomId),
          getAvailableUsersAction(),
        ]);

        if (roomData) {
          setRoomInfo(roomData);
          // Check if current user is admin
          const currentUserParticipant = roomData.participants.find(
            (p: any) => p.user.id === currentUserId
          );

          console.log(
            "currentUserParticipant?.permission",
            currentUserParticipant?.permission
          );
          setIsAdmin(currentUserParticipant?.permission === "ADMIN");
        }

        setAvailableUsers(usersData);
      } catch (error) {
        console.error("Error loading room info:", error);
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
      // Reload room info
      const roomData = await getRoomInfoAction(roomId);
      if (roomData) {
        setRoomInfo(roomData);
        // Notify parent component about room updates
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

  // Merge incoming props with local state to preserve optimistic items and order
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
  }, [initialMessages]);

  // Helper to scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior });
    } else if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior });
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, isAtBottom]);

  // Ensure we land at bottom on room change
  useLayoutEffect(() => {
    scrollToBottom("auto");
  }, [roomId]);

  // Track scroll position to determine if we should auto-scroll on new messages
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 48; // px from bottom considered as at-bottom
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setIsAtBottom(atBottom);
  };

  // Actions
  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (e) {
      console.error("Failed to copy");
    }
  }

  function startReply(message: Message) {
    setReplyTo(message);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function submitEdit(messageId: string) {
    const newContent = editDraft.trim();
    if (!newContent) return;
    // optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
      )
    );
    setEditingId(null);
    setEditDraft("");
    try {
      await fetch(`/api/messages/${messageId}/edit`, {
        method: "POST",
        body: JSON.stringify({ content: newContent }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Edit failed", e);
    }
  }

  async function deleteOne(messageId: string) {
    // optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await fetch(`/api/messages/${messageId}/delete`, { method: "POST" });
    } catch (e) {
      console.error("Delete failed", e);
    }
  }

  // Typing indicator functionality
  useEffect(() => {
    const channel = supabase.channel(`typing:${roomId}`, {
      config: {
        presence: { key: `typing:${roomId}` },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const now = Date.now();
        const typingMap: Record<string, { name: string; at: number }> = {};

        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            // Show typing indicator for all users except current user
            if (presence.typing && presence.userId !== currentUserId) {
              typingMap[presence.userId] = {
                name: presence.name || "Someone",
                at: now,
              };
            }
          });
        });

        setTypingUsers(typingMap);
      })
      .subscribe(async (status) => {
        console.log(`Typing channel ${roomId} status:`, status);
        if (status === "SUBSCRIBED") {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            await channel.track({
              userId: data.user.id,
              name: data.user.email,
              typing: false,
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, supabase]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  function onInputChange() {
    if (!isTyping) {
      setIsTyping(true);
      const channel = supabase.channel(`typing:${roomId}`, {
        config: {
          presence: { key: `typing:${roomId}` },
        },
      });
      channel.track({
        userId: currentUserId,
        name: "Current User",
        typing: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const channel = supabase.channel(`typing:${roomId}`, {
        config: {
          presence: { key: `typing:${roomId}` },
        },
      });
      channel.track({
        userId: currentUserId,
        name: "Current User",
        typing: false,
      });
    }, 1000);
  }

  async function clientSend(formData: FormData) {
    const content = String(formData.get("content") || "").trim();
    // allow empty content if there are attachments
    if (!content && uploadedFiles.length === 0) return;

    // attach uploaded files metadata
    if (uploadedFiles.length > 0) {
      formData.set("attachments", JSON.stringify(uploadedFiles));
    }

    // Clear input immediately for better UX
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      roomId,
      userId: currentUserId || "",
      content,
      createdAt: new Date().toISOString(),
      isEdited: false,
      user: {
        id: currentUserId || "",
        firstName: "You",
        lastName: "",
        avatar: null,
      },
      attachments: uploadedFiles.map((f) => ({
        id: `temp-${Math.random()}`,
        fileName: f.name || "file",
        filePath: f.url,
        fileSize: f.size || 0,
        mimeType:
          typeof f.type === "string" ? f.type : "application/octet-stream",
      })),
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);

    startTransition(async () => {
      try {
        await onSend(formData);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        clearFiles();
        // Clear reply target on successful send
        setReplyTo(null);
      } catch (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        // Restore input content
        if (inputRef.current) {
          inputRef.current.value = content;
        }
        console.error("Error sending message:", error);
      }
    });
    // Scroll to bottom on send
    scrollToBottom("smooth");
  }

  // Handle Enter key for new line vs send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange();
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isCurrentUser = (userId: string) => {
    return currentUserId ? userId === currentUserId : false;
  };

  const getInitials = (user: UserLite | undefined) => {
    if (!user) return "?";
    return (
      `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      user.firstName?.[0] ||
      "?"
    );
  };

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // Build a download URL; for Cloudinary, append fl_attachment to prompt download
  const buildDownloadUrl = (url: string, fileName?: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("res.cloudinary.com")) {
        if (!u.searchParams.has("fl_attachment")) {
          u.searchParams.set("fl_attachment", fileName || "download");
        }
      }
      return u.toString();
    } catch {
      return url;
    }
  };

  const downloadAttachments = (atts: NonNullable<Message["attachments"]>) => {
    atts.forEach(async (att) => {
      await forceDownload(att.filePath, att.fileName);
    });
  };

  const forceDownload = async (url: string, fileName?: string) => {
    try {
      const optimizedUrl = buildDownloadUrl(url, fileName);
      const res = await fetch(optimizedUrl, { mode: "cors" });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: navigate to URL (may open new tab if browser blocks)
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="relative col-span-8 flex flex-col justify-between min-h-full">
      <div className="px-4 py-3 border-b border-primary/10 flex items-center justify-between sticky top-0 z-10 bg-[#0F0A1D]/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-xs font-medium">
            {roomInfo?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={roomInfo.logo}
                alt={roomTitle || "Room"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              (roomInfo?.name || roomTitle || "R").slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="text-sm font-medium">
              {roomInfo?.name || roomTitle || "Conversation"}
            </div>
          </div>
        </div>
        <div className="flex items-center text-xs text-foreground/60 gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsRoomInfoOpen(true)}
              className="cursor-pointer"
              title="Room Information"
            >
              <Image
                src="/icons/edit.svg"
                alt="Edit"
                width={24}
                height={24}
                className="w-5 h-5"
              />
            </button>
          )}
        </div>
      </div>
      {/* Messages Area */}
      {isLoading ? (
        <ChatLoading />
      ) : (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 pb-12"
        >
          {orderedMessages.map((message, index) => {
            const isCurrent = isCurrentUser(message.userId);
            const prevMessage = index > 0 ? orderedMessages[index - 1] : null;
            const showAvatar =
              !prevMessage || prevMessage.userId !== message.userId;
            const showTime =
              !prevMessage ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                300000; // 5 minutes

            return (
              <div
                key={message.id}
                className={`flex ${
                  isCurrent ? "justify-end" : "justify-start"
                } group`}
              >
                <div
                  className={`flex max-w-[70%] ${
                    isCurrent ? "flex-row-reverse" : "flex-row"
                  } items-end gap-2`}
                >
                  {/* Avatar */}
                  {!isCurrent && showAvatar && (
                    <div className="relative">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.user?.avatar || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {getInitials(message.user)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={`flex flex-col ${
                      isCurrent ? "items-end" : "items-start"
                    } ${!isCurrent && !showAvatar ? "ml-10" : ""}`}
                  >
                    {/* Sender Name */}
                    {!isCurrent && showAvatar && message.user && (
                      <span className="text-xs text-foreground/60 mb-1 px-2">
                        {message.user.firstName} {message.user.lastName}
                      </span>
                    )}

                    {/* Message Bubble with actions */}
                    <div className="group relative">
                      <div
                        className={`relative px-4 py-2 rounded-2xl ${
                          isCurrent
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        } ${message.isEdited ? "opacity-75" : ""}`}
                      >
                        {editingId === message.id ? (
                          <div className="flex items-end gap-2 w-full max-w-[520px]">
                            <textarea
                              className="w-full bg-background/20 border border-border/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none"
                              rows={2}
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  submitEdit(message.id);
                                } else if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditDraft("");
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => submitEdit(message.id)}
                              className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                              {message.content}
                            </p>
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div
                                  className={`mt-2 grid gap-2 ${
                                    isCurrent
                                      ? "justify-items-end"
                                      : "justify-items-start"
                                  }`}
                                >
                                  {message.attachments.map((att) => {
                                    const isImage =
                                      att.mimeType.startsWith("image") ||
                                      att.filePath.match(
                                        /\.(png|jpe?g|gif|webp)$/i
                                      );
                                    const isVideo =
                                      att.mimeType.startsWith("video") ||
                                      att.filePath.match(/\.(mp4|webm|ogg)$/i);
                                    if (isImage) {
                                      return (
                                        <div key={att.id} className="relative">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={att.filePath}
                                            alt={att.fileName}
                                            className="max-w-[260px] rounded-md border border-border/40 cursor-pointer"
                                            onClick={() =>
                                              setPreviewImage({
                                                url: att.filePath,
                                                name: att.fileName,
                                              })
                                            }
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              forceDownload(
                                                att.filePath,
                                                att.fileName
                                              )
                                            }
                                            className={`absolute bottom-2 right-2 bg-background/80 border border-border/40 rounded px-2 py-0.5 text-[10px] ${
                                              isCurrent
                                                ? "text-foreground"
                                                : "text-foreground"
                                            }`}
                                          >
                                            Download
                                          </button>
                                        </div>
                                      );
                                    }
                                    if (isVideo) {
                                      return (
                                        <div key={att.id} className="relative">
                                          <video
                                            src={att.filePath}
                                            controls
                                            className="max-w-[320px] rounded-md border border-border/40"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              forceDownload(
                                                att.filePath,
                                                att.fileName
                                              )
                                            }
                                            className={`absolute bottom-2 right-2 bg-background/80 border border-border/40 rounded px-2 py-0.5 text-[10px] ${
                                              isCurrent
                                                ? "text-foreground"
                                                : "text-foreground"
                                            }`}
                                          >
                                            Download
                                          </button>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div
                                        key={att.id}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            forceDownload(
                                              att.filePath,
                                              att.fileName
                                            )
                                          }
                                          className={`${
                                            isCurrent
                                              ? "text-primary-foreground"
                                              : "text-foreground"
                                          } underline`}
                                        >
                                          {att.fileName}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            forceDownload(
                                              att.filePath,
                                              att.fileName
                                            )
                                          }
                                          className={`${
                                            isCurrent
                                              ? "text-primary-foreground"
                                              : "text-foreground"
                                          } underline`}
                                        >
                                          Download
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            {message.isEdited && (
                              <span className="text-xs opacity-60 ml-1">
                                (edited)
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div
                        className={`absolute -top-3 ${
                          isCurrent ? "left-2" : "right-2"
                        } opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-6 px-2 rounded bg-background/80 border text-xs">
                              •••
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align={isCurrent ? "start" : "end"}
                            className="w-36"
                          >
                            <DropdownMenuItem
                              onClick={() => copyMessage(message.content)}
                            >
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => startReply(message)}
                            >
                              Reply
                            </DropdownMenuItem>
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    downloadAttachments(message.attachments!)
                                  }
                                >
                                  Download
                                </DropdownMenuItem>
                              )}
                            {isCurrent && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingId(message.id);
                                  setEditDraft(message.content);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                            )}
                            {isCurrent && (
                              <DropdownMenuItem
                                onClick={() => deleteOne(message.id)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Timestamp */}
                    {showTime && (
                      <span className="text-xs text-foreground/50 mt-1 px-2">
                        {formatTime(message.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator - Always at bottom */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="flex justify-start">
              <div className="bg-muted flex items-end px-4 py-2 rounded-2xl rounded-bl-md">
                {/* <p className="text-xs text-foreground/60 mr-2">Typing</p> */}
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-foreground/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-1 h-1 bg-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>{" "}
            </div>
          )}
          {/* Bottom sentinel */}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 w-auto right-0 left-0 bg-[#0F0A1D]">
        {replyTo && (
          <div className="px-4 pt-2">
            <div className="flex items-center justify-between text-xs bg-muted/40 border border-border/40 rounded-md px-3 py-2">
              <div className="truncate">
                Replying to: {replyTo.user?.firstName || ""}{" "}
                {replyTo.user?.lastName || ""}
                <span className="opacity-70 ml-2 truncate">
                  {replyTo.content.slice(0, 80)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 px-2 py-0.5 rounded bg-background border"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* New input bar */}
        <form action={clientSend} className="px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 py-2 px-4 bg-[#0F0A1D]">
              <textarea
                ref={inputRef}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                name="content"
                placeholder="Type a message"
                className="flex-1 outline-none text-sm placeholder:text-foreground/50 resize-none max-h-[120px]"
                rows={1}
              />
              <div className="flex items-center gap-2 min-h-full">
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen((v) => !v)}
                  className="w-6 h-6 grid place-items-center rounded-md text-base"
                  aria-label="Emoji"
                >
                  <Image
                    src="/icons/emoji.svg"
                    alt="Emoji"
                    width={24}
                    height={24}
                    className="w-5 h-5"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-6 h-6 grid place-items-center rounded-md"
                  aria-label="Attach files"
                  disabled={isUploading}
                >
                  <Image
                    src="/icons/attach.svg"
                    alt="Attach files"
                    width={24}
                    height={24}
                    className="w-5 h-5"
                  />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.rtf"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      uploadFiles(files);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button
                  type="submit"
                  className="ml-1 rounded-full bg-[#3C2A86] hover:bg-[#4a35a5] text-white text-sm px-4 py-2"
                  disabled={isUploading}
                >
                  Send now
                </button>
              </div>
            </div>
            {isEmojiOpen && (
              <div className="relative">
                <div className="absolute right-0 -top-2 translate-y-[-100%] z-10 bg-background border rounded-md p-2 grid grid-cols-6 gap-1">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="hover:bg-muted rounded p-1"
                      onClick={() => {
                        const el = inputRef.current;
                        if (!el) return;
                        const start = el.selectionStart || 0;
                        const end = el.selectionEnd || 0;
                        const current = el.value;
                        el.value =
                          current.slice(0, start) + e + current.slice(end);
                        el.selectionStart = el.selectionEnd = start + e.length;
                        el.dispatchEvent(new Event("input", { bubbles: true }));
                        setIsEmojiOpen(false);
                        el.focus();
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {replyTo && (
            <input type="hidden" name="parentId" value={replyTo.id} />
          )}
        </form>

        {/* Selected attachments preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {uploadedFiles.map((f, idx) => {
              const isImage =
                f.type === "image" ||
                f.url.match(/\.(png|jpe?g|gif|webp)$/i) != null;
              const isVideo =
                f.type === "video" || f.url.match(/\.(mp4|webm|ogg)$/i) != null;
              return (
                <div
                  key={`${f.url}-${idx}`}
                  className="relative border border-border/40 rounded-md p-1"
                >
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-background border border-border/50 rounded-full w-5 h-5 text-xs"
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.url}
                      alt={f.name || "image"}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : isVideo ? (
                    <video
                      src={f.url}
                      className="w-24 h-16 object-cover rounded"
                    />
                  ) : (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline block max-w-[160px] truncate px-2 py-1"
                    >
                      {f.name || "file"}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <Dialog
          open={!!previewImage}
          onOpenChange={(open) => {
            if (!open) setPreviewImage(null);
          }}
        >
          <DialogContent className="sm:max-w-3xl p-2" showCloseButton>
            {previewImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage.url}
                alt={previewImage.name || "preview"}
                className="max-h-[80vh] w-auto mx-auto rounded"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Room Info Modal */}
        <RoomInfoModal
          isOpen={isRoomInfoOpen}
          onClose={() => setIsRoomInfoOpen(false)}
          roomInfo={roomInfo}
          onUpdate={handleRoomUpdate}
          availableUsers={availableUsers}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
