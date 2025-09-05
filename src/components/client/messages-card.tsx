import Image from "next/image";

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
        return 'Unknown';
      }
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icons/messages.svg"
          alt="Recent Messages"
          width={20}
          height={20}
        />
        <p className="figma-paragraph text-foreground">Recent Messages</p>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/60">No recent messages</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-figma-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-figma-text-white font-medium">
                    {message.user.firstName.charAt(0)}{message.user.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {message.user.firstName} {message.user.lastName}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    {truncateContent(message.content)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2">
        <button className="text-sm text-figma-primary hover:text-figma-primary-purple-1 transition-colors">
          View all messages
        </button>
      </div>
    </div>
  );
}
