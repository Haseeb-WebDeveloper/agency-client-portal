import { listMyRooms } from "@/actions/messaging";
import { getCurrentUser } from "@/lib/auth";
import MessagesClientShell from "@/components/messages/messages-client-shell";

interface MessagesPageProps {
  searchParams: Promise<{ roomId?: string }>;
}

export default async function MessagesIndex({ searchParams }: MessagesPageProps) {
  const me = await getCurrentUser();
  const rooms = await listMyRooms();
  const isAdmin = me.role === "PLATFORM_ADMIN" || me.role === "AGENCY_MEMBER";
  const resolvedSearchParams = await searchParams;
  const selectedRoomId = resolvedSearchParams.roomId;

  return (
    <div className="bg-[#0F0A1D]">
      <MessagesClientShell
        initialRooms={rooms}
        isAdmin={isAdmin}
        currentUserId={me.id}
        initialSelectedRoomId={selectedRoomId}
      />
    </div>
  );
}
