import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

export interface MessagesCardItem {
  id: string;
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  avatarFallback: string;
  href: string;
}

export function MessagesCardShared({
  items,
  totalUnseen,
  emptyText = "No recent messages",
}: {
  items: MessagesCardItem[];
  totalUnseen?: number;
  emptyText?: string;
}) {
  let badge = null;
  if (typeof totalUnseen === "number" && totalUnseen > 0) {
    badge = (
      <span className="ml-3 px-3 py-0.5 rounded-full text-xs  bg-[#FF5A5F]  shadow text-center min-w-[56px]">
        {totalUnseen > 3 ? `${totalUnseen}+ unseen` : `${totalUnseen} unseen`}
      </span>
    );
  }

  return (
    <div className="bg-transparent border border-primary/20  rounded-xl p-0 shadow-md" style={{ minWidth: 320 }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Image src="/icons/messages.svg" alt="Messages" width={22} height={22} className="opacity-90" />
          <span className="figma-paragraph text-foreground">Messages</span>
        </div>
        {badge}
      </div>

      <div>
        {items.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-foreground/60">{emptyText}</p>
          </div>
        ) : (
          items.slice(0, 2).map((item, idx) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center px-5 py-4 ${idx !== Math.min(items.length, 2) - 1 ? "border-b border-primary/20" : ""} group`}
              style={{ textDecoration: "none" }}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={item.avatarUrl || undefined} alt={item.title} />
                <AvatarFallback className="bg-primary/20 ">{item.avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 ml-3">
                <div className="flex items-center gap-2">
                  <span className="text-base line-clamp-1">{item.title}</span>
                </div>
                <p className="text-sm text-foreground/80 truncate mt-1">{item.subtitle}</p>
              </div>
              <span className="ml-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <ChevronRight className="text-foreground/80 w-5 h-5" />
              </span>
            </Link>
          ))
        )}
      </div>

      <div className="px-5 py-3 border-t border-primary/20">
        <Link href="/messages" className="text-sm text-foreground/80 hover:underline">
          View all messages
        </Link>
      </div>
    </div>
  );
}


