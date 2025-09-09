"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/clients";
import ChatRoom from "@/components/admin/chat-room";
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

type Room = {
  id: string;
  name: string;
  logo?: string | null;
  unread: number;
  latestMessage?: { content?: string } | null;
};

type Message = {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }>;
};

interface MessagesClientShellProps {
  initialRooms: Room[];
  isAdmin: boolean;
  currentUserId: string;
}

export default function MessagesClientShell({
  initialRooms,
  isAdmin,
  currentUserId,
}: MessagesClientShellProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    initialRooms[0]?.id || null
  );
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>(
    {}
  );
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);
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

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages for a room (always fetch and merge with cache to avoid partial lists)
  const fetchMessages = async (roomId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/messages/rooms/${roomId}/messages?limit=50`,
        {
          cache: "no-store",
        }
      );
      if (!response.ok) return;

      const data = await response.json();
      setMessagesCache((prev) => {
        const existing = prev[roomId] || [];
        const byId: Record<string, Message> = {};
        for (const m of existing) byId[m.id] = m;
        for (const m of data.items || []) byId[m.id] = m;
        const merged = Object.values(byId).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return {
          ...prev,
          [roomId]: merged,
        };
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark room as read
  const markRoomRead = async (roomId: string) => {
    try {
      await fetch(`/api/messages/rooms/${roomId}/read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking room as read:", error);
    }
  };

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    fetchMessages(roomId);
    markRoomRead(roomId);
    if (isMobile) {
      setIsRoomsSheetOpen(false);
    }
  };

  // Prefetch messages on hover
  const handleRoomHover = (roomId: string) => {
    if (!messagesCache[roomId]) {
      fetchMessages(roomId);
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

      // Fetch messages for the room
      fetchMessages(room.id);
      markRoomRead(room.id);

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

  const handleSendMessage = async (formData: FormData) => {
    const content = String(formData.get("content") || "");
    const hasAttachments = Boolean(formData.get("attachments"));
    if ((!content.trim() && !hasAttachments) || !selectedRoomId) return;

    try {
      const response = await fetch(
        `/api/messages/rooms/${selectedRoomId}/send`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        console.error("Failed to send message");
        throw new Error("Failed to send message");
      }
      // Refresh messages to include attachments since realtime payload doesn't include relations
      await fetchMessages(selectedRoomId);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error; // Re-throw to let ChatRoom handle the error
    }
  };

  // Set up realtime subscriptions for all rooms
  useEffect(() => {
    const channels: any[] = [];

    rooms.forEach((room) => {
      const channel = supabase
        .channel(`room:${room.id}`, {
          config: {
            presence: { key: `room:${room.id}` },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `roomId=eq.${room.id}`,
          },
          (payload) => {
            console.log(`Realtime update for room ${room.id}:`, payload);
            if (payload.eventType === "INSERT") {
              const newMessage = payload.new as Message;
              setMessagesCache((prev) => {
                const existing = prev[room.id] || [];
                // Check if message already exists to prevent duplicates
                if (existing.some((m) => m.id === newMessage.id)) {
                  console.log(
                    `Message ${newMessage.id} already exists, skipping duplicate`
                  );
                  return prev;
                }

                // Add new message and sort by creation time
                const updated = [...existing, newMessage].sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                );

                console.log(
                  `Added new message ${newMessage.id} to room ${room.id}`
                );
                return {
                  ...prev,
                  [room.id]: updated,
                };
              });

              // Update latest message in rooms list
              setRooms((prev) =>
                prev.map((r) =>
                  r.id === room.id
                    ? { ...r, latestMessage: { content: newMessage.content } }
                    : r
                )
              );
            }
          }
        )
        .subscribe(async (status) => {
          console.log(`Channel ${room.id} status:`, status);
        });

      channels.push(channel);
    });

    return () => {
      console.log("Cleaning up channels:", channels.length);
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [rooms, supabase]);

  // Load messages for selected room on mount
  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
      markRoomRead(selectedRoomId);
    }
  }, [selectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Track viewport for mobile vs desktop behavior
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
                        // eslint-disable-next-line @next/next/no-img-element
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
                        // eslint-disable-next-line @next/next/no-img-element
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
                selectedRoomId === room.id ? "" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm">
                {room.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                <ChatRoom
                  key={selectedRoomId}
                  roomId={selectedRoomId}
                  initialMessages={messagesCache[selectedRoomId] || []}
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
            <ChatRoom
              key={selectedRoomId}
              roomId={selectedRoomId}
              initialMessages={messagesCache[selectedRoomId] || []}
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
