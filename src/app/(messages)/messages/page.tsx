import { listMyRooms } from "@/actions/messaging";
import { getCurrentUser } from "@/lib/auth";
import MessagesClientShell from "@/components/messages/messages-client-shell";

export default async function MessagesIndex() {
  const me = await getCurrentUser();
  const rooms = await listMyRooms();
  const isAdmin = me.role === "PLATFORM_ADMIN" || me.role === "AGENCY_MEMBER";

  return (
    <div className="bg-[#0F0A1D]">
      <MessagesClientShell
        initialRooms={rooms}
        isAdmin={isAdmin}
        currentUserId={me.id}
      />
    </div>
  );
}
