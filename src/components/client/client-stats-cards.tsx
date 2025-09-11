import Image from "next/image";
import Link from "next/link";

interface ClientStatsCardsProps {
  contracts: {
    active: number;
  };
  offers: {
    toReview: number;
    pending: number;
  };
}

export function ClientStatsCards({ contracts, offers }: ClientStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Contracts Card */}
      <Link
        href="/client/contracts"
        className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/icons/contract.svg"
            alt="Contracts"
            width={20}
            height={20}
          />
          <p className="figma-paragraph text-foreground">Contracts</p>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-end gap-2">
            <span className="figma-h3 leading-[60%] text-figma-success">
              {contracts.active}
            </span>
            <span className="text-sm text-foreground leading-[100%]">
              Active
            </span>
          </div>
        </div>
      </Link>

      {/* Offers to Review Card */}
      <Link
        href="/client/offers"
        className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/icons/list.svg"
            alt="Offers to Review"
            width={20}
            height={20}
          />
          <p className="figma-paragraph text-foreground">Offers to Review</p>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-end gap-2">
            <span className="figma-h3 leading-[60%] text-figma-primary">
              {offers.toReview}
            </span>
            <span className="text-sm text-foreground leading-[100%]">New</span>
          </div>
          <div className="w-px h-8 bg-foreground/20"></div>
          <div className="flex items-end gap-2">
            <span className="figma-h3 leading-[60%] text-figma-warning">
              {offers.pending}
            </span>
            <span className="text-sm text-foreground leading-[100%]">
              Pending
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
