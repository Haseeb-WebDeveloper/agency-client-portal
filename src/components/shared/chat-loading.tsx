"use client";

export function ChatLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
      {/* Loading messages */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-start">
          <div className="flex max-w-[70%] flex-row items-end gap-2">
            {/* Avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse"></div>
            </div>

            {/* Message bubble */}
            <div className="flex flex-col items-start">
              <div className="h-3 w-16 bg-primary/10 rounded mb-1 animate-pulse"></div>
              <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md space-y-2">
                <div className="h-3 w-32 bg-primary/10 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-primary/10 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
