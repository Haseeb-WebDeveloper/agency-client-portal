import { listMyRooms } from "@/actions/messaging";
import { MessagesCardShared } from "@/components/shared/messages-card";

export async function   MessagesCard() {
  const rooms = await listMyRooms();

  // Calculate total unseen messages across all rooms
  const totalUnseen = rooms.reduce(
    (sum: number, r: any) => sum + (r.unseenCount || 0),
    0
  );

  const items = rooms.map((r: any) => ({
    id: r.id,
    title: r.name,
    subtitle: r.latestMessage?.content || "No messages yet",
    avatarUrl: r.logo || null,
    avatarFallback: r.name.slice(0, 2).toUpperCase(),
    href: `/messages?roomId=${r.id}`,
  }));

  return <MessagesCardShared items={items} totalUnseen={totalUnseen} />;
}
