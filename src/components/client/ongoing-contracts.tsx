import Image from "next/image";
import Link from "next/link";

interface Contract {
  id: string;
  title: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
}

interface OngoingContractsProps {
  contracts: Contract[];
}

export function OngoingContracts({ contracts }: OngoingContractsProps) {
  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "text-figma-warning";
      case "ACTIVE":
        return "text-figma-primary";
      case "PENDING_APPROVAL":
        return "text-figma-success";
      default:
        return "text-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "ACTIVE":
        return "Active";
      case "PENDING_APPROVAL":
        return "Pending Approval";
      default:
        return status;
    }
  };

  return (
    <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icons/stop-watch.svg"
          alt="Ongoing Contracts"
          width={20}
          height={20}
        />
        <p className="figma-paragraph text-foreground">Ongoing Contracts</p>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/60">No ongoing contracts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const progressPercentage = getProgressPercentage(
              Number(contract.completed_tasks),
              Number(contract.total_tasks)
            );

            return (
              <Link
                key={contract.id}
                href={`/client/contracts/${contract.id}`}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    {contract.title}
                  </h4>
                  <span
                    className={`text-xs ${getStatusColor(contract.status)}`}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>
                      {Number(contract.completed_tasks)} of{" "}
                      {Number(contract.total_tasks)} tasks completed
                    </span>
                    <span>{progressPercentage}%</span>
                  </div>

                  <div className="w-full bg-foreground/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-figma-primary to-figma-primary-purple-1 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
