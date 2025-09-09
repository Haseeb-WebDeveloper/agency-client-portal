"use client";

export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-foreground/60">Loading...</p>
      </div>
    </div>
  );
}
