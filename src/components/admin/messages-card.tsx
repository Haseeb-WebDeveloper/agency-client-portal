import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { listMyRooms } from "@/actions/messaging";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  room: {
    name: string;
  };
}

export async function MessagesCard() {
  const rooms = await listMyRooms();
  return (
    <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/icons/messages.svg"
            alt="Messages"
            width={20}
            height={20}
          />
          <p className="figma-paragraph text-foreground">Messages</p>
        </div>
        <Link href="/messages" className="text-sm text-figma-primary">
          View all
        </Link>
      </div>
      
      <div className="space-y-4">
        {rooms.slice(0, 3).map((r) => (
          <Link key={r.id} href={`/messages/${r.id}`} className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={r.logo || ""} alt={r.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {r.name.slice(0,2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {r.name}
                </span>
                {r.latestMessage?.createdAt && (
                  <span className="text-xs text-foreground/60">
                    {formatDistanceToNow(new Date(r.latestMessage.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/80 truncate">
                {r.latestMessage?.content || 'No messages yet'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
