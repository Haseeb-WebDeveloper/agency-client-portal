import { getRoomsWithUnreadOptimized } from "@/actions/messages-optimized";
import { getCurrentUser } from "@/lib/auth";
import MessagesOptimizedShell from "@/components/messages/messages-optimized-shell";
import { redirect } from "next/navigation";

interface MessagesPageProps {
  searchParams: Promise<{ roomId?: string }>;
}

export default async function MessagesIndex({ searchParams }: MessagesPageProps) {
  const me = await getCurrentUser();
  const rooms = await getRoomsWithUnreadOptimized();

  if (!me) {
    redirect("/login");
  }
  const isAdmin = me.role === "PLATFORM_ADMIN" || me.role === "AGENCY_MEMBER";
  const resolvedSearchParams = await searchParams;
  const selectedRoomId = resolvedSearchParams.roomId;

  return (
    <div className="bg-[#0F0A1D]">
      <MessagesOptimizedShell
        initialRooms={rooms}
        isAdmin={isAdmin}
        currentUserId={me.id}
        initialSelectedRoomId={selectedRoomId}
      />
    </div>
  );
}
