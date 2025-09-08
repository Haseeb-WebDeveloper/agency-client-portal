"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
};

interface ChatRoomProps {
  roomId: string;
  initialMessages: Message[];
  onSend: (formData: FormData) => Promise<void>;
  currentUserId?: string;
}

export default function ChatRoom({
  roomId,
  initialMessages,
  onSend,
  currentUserId,
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

  // Merge incoming props with local state to preserve optimistic items and order
  useEffect(() => {
    const byId: Record<string, Message> = {};
    for (const m of messages) byId[m.id] = m;
    for (const m of initialMessages) byId[m.id] = m;
    const merged = Object.values(byId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setIsAtBottom(atBottom);
  };

  // Actions
  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (e) {
      console.error('Failed to copy');
    }
  }

  async function submitEdit(messageId: string) {
    const newContent = editDraft.trim();
    if (!newContent) return;
    // optimistic update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent, isEdited: true } : m));
    setEditingId(null);
    setEditDraft("");
    try {
      await fetch(`/api/messages/${messageId}/edit`, { method: 'POST', body: JSON.stringify({ content: newContent }), headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('Edit failed', e);
    }
  }

  async function deleteOne(messageId: string) {
    // optimistic remove
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await fetch(`/api/messages/${messageId}/delete`, { method: 'POST' });
    } catch (e) {
      console.error('Delete failed', e);
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
    if (!content) return;

    // Clear input immediately for better UX
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = 'auto';
    }

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      roomId,
      userId: currentUserId || '',
      content,
      createdAt: new Date().toISOString(),
      isEdited: false,
      user: {
        id: currentUserId || '',
        firstName: 'You',
        lastName: '',
        avatar: null,
      },
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    startTransition(async () => {
      try {
        await onSend(formData);
        // Remove optimistic message and let realtime update handle the real one
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      } catch (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange();
    // Auto-resize
    e.target.style.height = 'auto';
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
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  return (
    <div className="relative col-span-8 flex flex-col justify-between min-h-full">
      {/* Messages Area */}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
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
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.user?.avatar || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(message.user)}
                    </AvatarFallback>
                  </Avatar>
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
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submitEdit(message.id);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditDraft("");
                              }
                            }}
                            autoFocus
                          />
                          <button onClick={() => submitEdit(message.id)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">Save</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {message.content}
                          </p>
                          {message.isEdited && (
                            <span className="text-xs opacity-60 ml-1">(edited)</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Hover actions */}
                    <div className={`absolute -top-3 ${isCurrent ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 px-2 rounded bg-background/80 border text-xs">•••</button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isCurrent ? 'start' : 'end'} className="w-36">
                          <DropdownMenuItem onClick={() => copyMessage(message.content)}>Copy</DropdownMenuItem>
                          {isCurrent && (
                            <DropdownMenuItem onClick={() => { setEditingId(message.id); setEditDraft(message.content); }}>Edit</DropdownMenuItem>
                          )}
                          {isCurrent && (
                            <DropdownMenuItem onClick={() => deleteOne(message.id)} className="text-destructive">Delete</DropdownMenuItem>
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

      {/* Input Area */}
      <div className="sticky bottom-0 w-auto right-0 left-0  border-t border-border/50 bg-[#0F0A1D]">
        <form action={clientSend} className="p-4 flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              name="content"
              placeholder="Type a message... "
              className="w-full bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            {/* No sending spinner for instant feel */}
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
