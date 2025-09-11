"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/clients";
import ChatRoomOptimized from "@/components/messages/chat-room-optimized";
import Image from "next/image";
import CreateRoomModal from "@/components/admin/create-room-modal";
import {
  searchRoomsAndUsersAction,
  createRoomAction,
  createDMRoomAction,
} from "@/actions/messages-client";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MessageCache, UserSessionCache } from "@/lib/message-cache";
import { getRoomsWithUnreadOptimized, sendMessageOptimized, markRoomReadOptimized, getMessagesOptimized } from "@/actions/messages-optimized";
import PerformanceMonitor from "@/components/messages/performance-monitor";

type Room = {
  id: string;
  name: string;
  logo?: string | null;
  unread: number;
  latestMessage?: { content?: string } | null;
};

interface MessagesOptimizedShellProps {
  initialRooms: Room[];
  isAdmin: boolean;
  currentUserId: string;
  initialSelectedRoomId?: string;
}

export default function MessagesOptimizedShell({
  initialRooms,
  isAdmin,
  currentUserId,
  initialSelectedRoomId,
}: MessagesOptimizedShellProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    initialSelectedRoomId || initialRooms[0]?.id || null
  );
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isMobile, setIsMobile] = useState(false);
  const [isRoomsSheetOpen, setIsRoomsSheetOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{
    rooms: Array<{ id: string; name: string; logo?: string | null }>;
    users: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      role: string;
    }>;
  }>({ rooms: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Cache initial data
  useEffect(() => {
    // Cache rooms for instant access
    UserSessionCache.setRooms(rooms);
    
    // Pre-cache messages for first room
    if (rooms.length > 0) {
      const firstRoomId = rooms[0].id;
      const cachedMessages = MessageCache.get(firstRoomId);
      if (!cachedMessages) {
        // Pre-load first room messages
        loadRoomMessages(firstRoomId);
      }
    }
  }, [rooms]);

  // Load messages for a room - USING SERVER ACTION!
  const loadRoomMessages = async (roomId: string) => {
    try {
      // Check cache first
      const cached = MessageCache.get(roomId);
      if (cached && cached.length > 0) {
        console.log("💾 [CACHE] Using cached messages for room:", roomId);
        return cached;
      }

      console.log("📡 [SERVER ACTION] Fetching messages for room:", roomId);
      
      // Use server action instead of API route
      const result = await getMessagesOptimized(roomId, null, 50);
      const serverMessages = result.items || [];
      
      // Convert Date objects to strings to match CachedMessage type
      const convertedMessages = serverMessages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
        updatedAt: msg.updatedAt instanceof Date ? msg.updatedAt.toISOString() : msg.updatedAt,
        attachments: msg.attachments?.map(att => ({
          ...att,
          createdAt: att.createdAt instanceof Date ? att.createdAt.toISOString() : att.createdAt,
          updatedAt: att.updatedAt instanceof Date ? att.updatedAt.toISOString() : att.updatedAt,
        })) || [],
        parent: msg.parent ? {
          ...msg.parent,
          createdAt: msg.parent.createdAt instanceof Date ? msg.parent.createdAt.toISOString() : msg.parent.createdAt,
          updatedAt: msg.parent.updatedAt instanceof Date ? msg.parent.updatedAt.toISOString() : msg.parent.updatedAt,
          attachments: (msg.parent as any).attachments?.map((att: any) => ({
            ...att,
            createdAt: att.createdAt instanceof Date ? att.createdAt.toISOString() : att.createdAt,
            updatedAt: att.updatedAt instanceof Date ? att.updatedAt.toISOString() : att.updatedAt,
          })) || [],
        } : null,
      }));
      
      // Cache the messages
      MessageCache.set(roomId, convertedMessages);
      console.log("💾 [CACHE] Cached", convertedMessages.length, "messages for room:", roomId);
      
      return convertedMessages;
    } catch (error) {
      console.error("❌ [SERVER ACTION] Error loading room messages:", error);
      return [];
    }
  };

  // Handle room selection with instant loading - USING SERVER ACTION!
  const handleRoomSelect = async (roomId: string) => {
    setSelectedRoomId(roomId);
    
    // Mark as read immediately using server action
    try {
      console.log("📖 [SERVER ACTION] Marking room as read:", roomId);
      await markRoomReadOptimized(roomId);
      console.log("✅ [SERVER ACTION] Room marked as read successfully");
    } catch (error) {
      console.error("❌ [SERVER ACTION] Error marking room as read:", error);
    }

    if (isMobile) {
      setIsRoomsSheetOpen(false);
    }
  };

  // Prefetch messages on hover for instant switching
  const handleRoomHover = async (roomId: string) => {
    const cached = MessageCache.get(roomId);
    if (!cached || cached.length === 0) {
      // Pre-load messages in background
      loadRoomMessages(roomId);
    }
  };

  // Handle search
  const handleSearch = async (formData: FormData) => {
    const query = String(formData.get("q") || "").trim();
    if (!query) {
      setSearchResults({ rooms: [], users: [] });
      setSearchTerm("");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchRoomsAndUsersAction(formData);
      setSearchResults(result);
      setSearchTerm(query);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.trim()) {
      setSearchResults({ rooms: [], users: [] });
      setSearchTerm("");
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchResults({ rooms: [], users: [] });
    setSearchTerm("");
  };

  // Handle user click to create or open DM
  const handleUserClick = async (userId: string) => {
    try {
      const room = await createDMRoomAction(userId);

      // Add the room to the local state if it's new
      const existingRoom = rooms.find((r) => r.id === room.id);
      if (!existingRoom) {
        setRooms((prev) => [
          {
            id: room.id,
            name: room.name,
            logo: room.logo,
            unread: 0,
            latestMessage: null,
          },
          ...prev,
        ]);
      }

      // Select the room and clear search
      setSelectedRoomId(room.id);
      clearSearch();

      if (isMobile) {
        setIsRoomsSheetOpen(false);
      }
    } catch (error) {
      console.error("Error creating DM room:", error);
    }
  };

  // Handle room updates from ChatRoom
  const handleRoomUpdate = (
    roomId: string,
    updates: { name?: string; logo?: string | null }
  ) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, ...updates } : room))
    );
  };

  // Handle room creation
  const handleCreateRoom = async (formData: FormData) => {
    try {
      const newRoom = await createRoomAction(formData);

      // Add the new room to the local state
      setRooms((prev) => [
        {
          id: newRoom.id,
          name: newRoom.name,
          logo: newRoom.logo,
          unread: 0,
          latestMessage: null,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  // ACTUAL server action implementation (not API routes!)
  const handleSendMessage = async (formData: FormData): Promise<void> => {
    const startTime = performance.now();
    console.log("🚀 [SERVER ACTION] Starting message send at:", new Date().toISOString());
    
    const content = String(formData.get("content") || "");
    const parentId = formData.get("parentId") as string | null;
    
    if (!content.trim() || !selectedRoomId) return;

    try {
      const serverActionStartTime = performance.now();
      console.log("⚡ [SERVER ACTION] Calling sendMessageOptimized at:", new Date().toISOString());
      
      // ACTUAL SERVER ACTION - NOT API ROUTE!
      await sendMessageOptimized(selectedRoomId, content, parentId);

      const serverActionEndTime = performance.now();
      console.log("⚡ [SERVER ACTION] Server action completed in:", serverActionEndTime - serverActionStartTime, "ms");
      
      const totalTime = performance.now() - startTime;
      console.log("✅ [SERVER ACTION] Total server action time:", totalTime, "ms");
      
    } catch (error) {
      console.error("❌ [SERVER ACTION] Error sending message:", error);
      throw error;
    }
  };

  // Optimized realtime subscription - single channel for all rooms
  useEffect(() => {
    if (!selectedRoomId) return;
    console.log("🔄 [PERFORMANCE] Subscribed to channel for room:", selectedRoomId);
    const channel = supabase
      .channel(`messages:${selectedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `roomId=eq.${selectedRoomId}`,
        },
        (payload) => {
          console.log("📨 [REALTIME] Received new message in shell:", payload);
          const newMessage = payload.new as any;
          
          // Update room's latest message immediately
          setRooms((prev) =>
            prev.map((r) =>
              r.id === selectedRoomId
                ? {
                    ...r,
                    latestMessage: { content: newMessage.content },
                  }
                : r
            )
          );

          // Add to cache immediately for instant UI update
          MessageCache.addMessage(selectedRoomId, newMessage);
        }
      )
      .subscribe((status) => {
        console.log("🔄 [REALTIME] Shell subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("✅ [REALTIME] Shell successfully subscribed to messages for room:", selectedRoomId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error("❌ [REALTIME] Shell channel error for room:", selectedRoomId);
        } else if (status === 'TIMED_OUT') {
          console.error("❌ [REALTIME] Shell subscription timed out for room:", selectedRoomId);
        } else if (status === 'CLOSED') {
          console.log("🔒 [REALTIME] Shell subscription closed for room:", selectedRoomId);
        }
      });
    console.log("🔄 [PERFORMANCE] Subscribed to channel for room:", selectedRoomId);

    return () => {
      console.log("🔄 [PERFORMANCE] Removing channel for room:", selectedRoomId);
      supabase.removeChannel(channel);
    };
  }, [selectedRoomId, supabase]);

  // Track viewport for mobile vs desktop behavior
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const RoomsList = (
    <div className="px-4 space-y-4">
      <h3 className="figma-h3">Messaging</h3>
      <div className="flex items-center gap-2">
        <form action={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <input
              name="q"
              placeholder="Search rooms or users"
              className="w-full border border-primary/20 rounded-full px-3 py-2 text-sm pr-8"
              onChange={handleSearchInputChange}
              defaultValue={searchTerm}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60 hover:text-foreground"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {isSearching && (
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          )}
        </form>
        {isAdmin && (
          <CreateRoomModal
            onCreate={handleCreateRoom}
            trigger={
              <button className="cursor-pointer w-10 h-10 grid place-items-center border border-primary/20 rounded-full">
                <Image
                  src="/icons/add.svg"
                  alt="plus"
                  width={550}
                  height={550}
                  className="w-5 h-5"
                />
              </button>
            }
          />
        )}
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-3">
          {searchResults.rooms.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground/80 mb-2">
                Rooms
              </h4>
              <div className="space-y-1">
                {searchResults.rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomSelect(room.id)}
                    className="cursor-pointer border-transparent hover:border-foreground/10 border w-full text-left flex items-start gap-3 p-3 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm">
                      {room.logo ? (
                        <img
                          src={room.logo}
                          alt={room.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        room.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {room.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.users.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground/80 mb-2">
                Users
              </h4>
              <div className="space-y-1">
                {searchResults.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="cursor-pointer hover:border-foreground/10 border w-full text-left flex items-center gap-3 p-3 rounded-lg border-transparent"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-foreground/60 truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-xs text-foreground/60 capitalize">
                      {user.role.toLowerCase().replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchTerm &&
            searchResults.rooms.length === 0 &&
            searchResults.users.length === 0 &&
            !isSearching && (
              <div className="text-center py-8">
                <p className="text-sm text-foreground/60">
                  No results found for "{searchTerm}"
                </p>
              </div>
            )}
        </div>
      )}

      {/* Regular Room List */}
      {!searchTerm && (
        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              onMouseEnter={() => handleRoomHover(room.id)}
              className={`cursor-pointer border-transparent hover:border-foreground/10 border w-full text-left flex items-start gap-3 p-3 rounded-lg ${
                selectedRoomId === room.id ? "bg-primary/10" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm">
                {room.logo ? (
                  <img
                    src={room.logo}
                    alt={room.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  room.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{room.name}</p>
                  {room.unread > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-background text-xs px-2 py-0.5">
                      {room.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/60 truncate">
                  {room.latestMessage?.content || "No messages yet"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-74px)]">
      <PerformanceMonitor />
      {/* Mobile top bar with trigger to open rooms list */}
      <div className="flex items-center gap-2 border-b border-primary/10 px-4 py-3 md:hidden">
        <button
          onClick={() => setIsRoomsSheetOpen(true)}
          className="cursor-pointer w-9 h-9 grid place-items-center rounded-md border border-primary/20"
          aria-label="Open conversations"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18" />
            <path d="M3 6h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {selectedRoom?.name || "Conversations"}
          </p>
        </div>
      </div>

      {/* Desktop: resizable sidebar + chat */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={40}
            className="h-full"
          >
            <aside className="h-full py-4 border-r border-primary/10 overflow-y-auto">
              {RoomsList}
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="h-full">
            <section className="h-full overflow-y-auto">
              {!selectedRoomId || !selectedRoom ? (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-foreground/60">Select a conversation</p>
                </div>
              ) : (
                <ChatRoomOptimized
                  key={selectedRoomId}
                  roomId={selectedRoomId}
                  initialMessages={MessageCache.get(selectedRoomId) || []}
                  onSend={handleSendMessage}
                  currentUserId={currentUserId}
                  roomTitle={selectedRoom.name}
                  onRoomUpdate={handleRoomUpdate}
                />
              )}
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: full-screen chat; rooms in sheet */}
      <div className="md:hidden h-[calc(100%-52px)]">
        <section className="h-full overflow-y-auto">
          {!selectedRoomId || !selectedRoom ? (
            <div className="h-full w-full flex items-center justify-center p-6 text-center">
              <p className="text-foreground/60">
                Open the menu to choose a conversation
              </p>
            </div>
          ) : (
            <ChatRoomOptimized
              key={selectedRoomId}
              roomId={selectedRoomId}
              initialMessages={MessageCache.get(selectedRoomId) || []}
              onSend={handleSendMessage}
              currentUserId={currentUserId}
              roomTitle={selectedRoom.name}
              onRoomUpdate={handleRoomUpdate}
            />
          )}
        </section>

        <Sheet open={isRoomsSheetOpen} onOpenChange={setIsRoomsSheetOpen}>
          <SheetContent side="left" className="p-0">
            <div className="py-2 overflow-y-auto">{RoomsList}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
