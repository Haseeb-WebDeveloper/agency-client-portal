import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

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

interface MessagesCardProps {
  messages: Message[];
}

export function MessagesCard({ messages }: MessagesCardProps) {
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
        <span className="bg-figma-warning text-figma-text-white text-xs px-2 py-1 rounded-full">
          {messages.length}+ unseen
        </span>
      </div>
      
      <div className="space-y-4">
        {messages.slice(0, 2).map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.user.avatar || ""} alt={`${message.user.firstName} ${message.user.lastName}`} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {message.user.firstName.charAt(0)}{message.user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {message.user.firstName} {message.user.lastName}
                </span>
                <span className="text-xs text-foreground/60">
                  {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-foreground/80 truncate">
                {message.content.length > 50 
                  ? `${message.content.substring(0, 50)}...` 
                  : message.content
                }
              </p>
            </div>
          </div>
        ))}
        
        {messages.length > 2 && (
          <div className="pt-2">
            <button className="text-sm text-figma-primary hover:text-figma-primary-purple-1 transition-colors">
              View all messages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
