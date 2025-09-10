import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
  room: {
    name: string;
  };
}

interface MessagesCardProps {
  messages: Message[];
}

export function MessagesCard({ messages }: MessagesCardProps) {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown";
      }
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return "Yesterday";
      return date.toLocaleDateString();
    } catch (error) {
      return "Unknown";
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-transparent border border-primary/20  rounded-xl p-0 shadow-md" style={{ minWidth: 320 }}>
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
          <span className="figma-paragraph text-foreground">Messages</span>
        </div>
      </div>

      {/* Message previews */}
      <div>
        {messages.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-foreground/60">No recent messages</p>
          </div>
        ) : (
          messages.slice(0, 2).map((message, idx) => (
            <Link
              key={message.id}
              href={`/messages`}
              className={`flex items-center px-5 py-4 ${idx !== Math.min(messages.length, 2) - 1 ? "border-b border-primary/20" : ""} group`}
              style={{ textDecoration: "none" }}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={message.user.avatar || undefined} alt={`${message.user.firstName} ${message.user.lastName}`} />
                <AvatarFallback className="bg-primary/20 ">
                  {`${message.user.firstName.charAt(0)}${message.user.lastName.charAt(0)}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 ml-3">
                <div className="flex items-center gap-2">
                  <span className="text-base ">
                    {message.user.firstName} {message.user.lastName}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 truncate mt-1">
                  {truncateContent(message.content)}
                </p>
              </div>
              <span className="ml-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <ChevronRight className="text-foreground/80 w-5 h-5" />
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-primary/20">
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
