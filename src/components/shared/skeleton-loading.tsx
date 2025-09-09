"use client";

export function SkeletonLoading({
  type = "card",
}: {
  type?: "card" | "list" | "table";
}) {
  if (type === "card") {
    return (
      <div className="border border-primary/20 rounded-lg p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-primary/10 rounded w-3/4"></div>
        <div className="h-4 bg-primary/10 rounded w-full"></div>
        <div className="h-4 bg-primary/10 rounded w-2/3"></div>
        <div className="pt-4 flex justify-between">
          <div className="h-8 w-20 bg-primary/10 rounded"></div>
          <div className="h-8 w-20 bg-primary/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border border-primary/20 rounded-lg p-6 space-y-4 animate-pulse"
          >
            <div className="h-6 bg-primary/10 rounded w-3/4"></div>
            <div className="h-4 bg-primary/10 rounded w-full"></div>
            <div className="h-4 bg-primary/10 rounded w-2/3"></div>
            <div className="pt-4 flex justify-between">
              <div className="h-8 w-24 bg-primary/10 rounded"></div>
              <div className="h-8 w-24 bg-primary/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="border border-primary/20 rounded-lg p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-primary/10 rounded w-1/4 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-primary/10 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
