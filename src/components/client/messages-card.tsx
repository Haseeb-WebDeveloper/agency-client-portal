import { MessagesCardShared, MessagesCardItem } from "@/components/shared/messages-card";

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
    id?: string;
    name: string;
  };
}

interface MessagesCardProps {
  messages: Message[];
}

export function MessagesCard({ messages }: MessagesCardProps) {
  const truncate = (content: string, maxLength: number = 100) =>
    content.length <= maxLength ? content : content.substring(0, maxLength) + "...";

  const items: MessagesCardItem[] = messages.map((message) => ({
    id: message.id,
    title: `${message.user.firstName} ${message.user.lastName}`,
    subtitle: truncate(message.content),
    avatarUrl: message.user.avatar || undefined,
    avatarFallback: `${message.user.firstName.charAt(0)}${message.user.lastName.charAt(0)}`.toUpperCase(),
    href: `/messages${message.room?.id ? `?roomId=${message.room.id}` : ""}`,
  }));

  return <MessagesCardShared items={items} />;
}
