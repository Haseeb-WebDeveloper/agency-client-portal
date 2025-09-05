import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Client {
  id: string;
  name: string;
  logo: string | null;
  activeContracts: number;
  pendingContracts: number;
  lastActivity: Date;
}

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icons/members.svg"
          alt="Client Snapshot"
          width={20}
          height={20}
        />
        <p className="figma-paragraph text-foreground">Client Snapshot</p>
      </div>
      
      <div className="space-y-4">
        {clients.map((client) => (
          <div key={client.id} className="flex items-center justify-between py-3 border-b border-foreground/10 last:border-b-0">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={client.logo || ""} alt={client.name} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {client.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground font-medium">{client.name}</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm font-semibold text-foreground">{client.activeContracts}</div>
                <div className="text-xs text-foreground/60">Active</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-foreground">{client.pendingContracts}</div>
                <div className="text-xs text-foreground/60">Pending</div>
              </div>
              <div className="text-center min-w-[120px]">
                <div className="text-xs text-foreground/60">
                  {formatDistanceToNow(client.lastActivity, { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
