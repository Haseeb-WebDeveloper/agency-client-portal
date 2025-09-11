import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  logo: string | null;
  activeContracts: number;
  pendingContracts: number;
  lastActivity: string | Date;
}

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  // Show only the first 5 clients
  const visibleClients = clients.slice(0, 5);
  const showViewAll = clients.length > 2;

  return (
    <div className="bg-transparent border-primary/20 space-y-6">
      <div className="overflow-hidden rounded-lg border border-primary/20">
        <div className="flex items-center gap-3 px-4 py-6">
          <p className="figma-paragraph text-foreground/90">Client Snapshot</p>
        </div>
        <table className="w-full">
          <thead className="border-b border-primary/20 bg-transparent">
            <tr>
              <th className="px-6 py-4 text-left figma-paragraph  text-nowrap">
                Clients
              </th>
              <th className="px-6 py-4 text-center figma-paragraph  text-nowrap">
                Active contracts
              </th>
              <th className="px-6 py-4 text-center figma-paragraph  text-nowrap">
                Pending contracts
              </th>
              <th className="px-6 py-4 text-left figma-paragraph  text-nowrap">
                Last activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/20">
            {visibleClients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-primary/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={client.logo || ""} alt={client.name} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground font-medium text-nowrap">
                      {client.name}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {client.activeContracts}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-lg font-semibold text-foreground">
                    {client.pendingContracts}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-foreground/70">
                    {(() => {
                      try {
                        const date =
                          typeof client.lastActivity === "string"
                            ? new Date(client.lastActivity)
                            : client.lastActivity;
                        if (isNaN(date.getTime())) {
                          return "No activity yet";
                        }
                        return formatDistanceToNow(date, { addSuffix: true });
                      } catch (error) {
                        return "No activity yet";
                      }
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showViewAll && (
          <div className="flex justify-end px-6 py-4">
            <Link
              href="/admin/clients"
              className="text-sm text-foreground/80 hover:underline"
            >
              View all clients
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
