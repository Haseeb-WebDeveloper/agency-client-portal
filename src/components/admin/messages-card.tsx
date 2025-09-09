import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { listMyRooms } from "@/actions/messaging";
import { ChevronRight } from "lucide-react";

export async function MessagesCard() {
  const rooms = await listMyRooms();

  // Calculate total unseen messages across all rooms
  const totalUnseen = rooms.reduce(
    (sum: number, r: any) => sum + (r.unseenCount || 0),
    0
  );

  // Badge logic (red pill style)
  let badge = null;
  if (totalUnseen > 0) {
    badge = (
      <span className="ml-3 px-3 py-0.5 rounded-full text-xs  bg-[#FF5A5F]  shadow text-center min-w-[56px]">
        {totalUnseen > 3 ? `${totalUnseen}+ unseen` : `${totalUnseen} unseen`}
      </span>
    );
  }

  return (
    <div className="border border-[#4B3971] rounded-xl p-0 shadow-md" style={{ minWidth: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/messages.svg"
            alt="Messages"
            width={22}
            height={22}
            className="opacity-90"
          />
          <span className="text-lg tracking-tight">Messages</span>
        </div>
        {badge}
      </div>

      {/* Message previews */}
      <div>
        {rooms.slice(0, 2).map((r, idx) => (
          <Link
            key={r.id}
            href={`/messages?roomId=${r.id}`}
            className={`flex items-center px-5 py-4 ${idx !== rooms.slice(0, 2).length - 1 ? "border-b border-[#32255A]" : ""} group`}
            style={{ textDecoration: "none" }}
          >
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={r.logo || ""} alt={r.name} />
              <AvatarFallback className="bg-[#2D2347] ">
                {r.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 ml-3">
              <div className="flex items-center gap-2">
                <span className="text-base ">
                  {r.name}
                </span>
              </div>
              <p className="text-sm text-foreground/80 truncate mt-1">
                {r.latestMessage?.content || "Lorem ipsum dolor sit amet consectetur ..."}
              </p>
            </div>
            <span className="ml-3 flex items-center justify-center w-8 h-8 rounded-full bg-[#2D2347] group-hover:bg-[#3A2C5F] transition-colors">
              <ChevronRight className="text-foreground/80 w-5 h-5" />
            </span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#32255A]">
        <Link
          href="/messages"
          className="text-sm text-foreground/80 hover:underline"
        >
          View all messages
        </Link>
      </div>
    </div>
  );
}
