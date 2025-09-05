import Image from "next/image";

interface StatsCardsProps {
  contracts: {
    active: number;
    drafts: number;
  };
  offers: {
    new: number;
    pending: number;
  };
}

export function StatsCards({ contracts, offers }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Contracts Card */}
      <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8">
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
          <div className="w-px h-8 bg-foreground/20"></div>
          <div className="flex items-end gap-2">
            <span className="figma-h3 leading-[60%] text-orange-400">
              {contracts.drafts}
            </span>
            <span className="text-sm text-foreground leading-[100%]">
              Drafts
            </span>
          </div>
        </div>
      </div>

      {/* Offers Card */}
      <div className="bg-transparent border-primary/20 px-7 py-6 border rounded-lg space-y-8">
        <div className="flex items-center gap-3">
          <Image
            src="/icons/list.svg"
            alt="Offers"
            width={20}
            height={20}
          />
          <p className="figma-paragraph text-foreground">Offers</p>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-end gap-2">
            <span className="figma-h3 leading-[60%] text-figma-primary">
              {offers.new}
            </span>
            <span className="text-sm text-foreground leading-[100%]">
              New
            </span>
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
      </div>
    </div>
  );
}
