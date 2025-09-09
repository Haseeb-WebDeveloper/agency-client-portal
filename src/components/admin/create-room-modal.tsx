"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

type CreateRoomModalProps = {
  onCreate: (formData: FormData) => Promise<void>;
  trigger?: React.ReactNode;
};

export default function CreateRoomModal({
  onCreate,
  trigger,
}: CreateRoomModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    // Only fetch when the modal is open
    if (!open) return;

    let ignore = false;
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const url = new URL("/api/messages/users", window.location.origin);
        if (query) url.searchParams.set("q", query);
        url.searchParams.set("limit", "10");
        const res = await fetch(url.toString(), {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) {
          const items = (data.items || []) as Array<{
            label: string;
            value: string;
          }>;
          setOptions(items);
        }
      } catch (error) {
        // Only log non-abort errors
        if (error instanceof Error && error.name !== "AbortError" && !ignore) {
          console.error("Error fetching users:", error);
        }
      }
    };

    fetchUsers();

    return () => {
      ignore = true;
      // Only abort if the controller hasn't been aborted yet
      if (controller.signal && !controller.signal.aborted) {
        controller.abort();
      }
    };
  }, [query, open]);

  function handleSubmit(formData: FormData) {
    formData.set("members", selectedUserIds.join(","));
    startTransition(async () => {
      await onCreate(formData);
      setOpen(false);
      setSelectedUserIds([]);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="w-10 h-10 grid place-items-center border border-primary/20 rounded-md">
            <span className="text-xl">+</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#0F0A1D]">
        <DialogHeader>
          <DialogTitle>Create room</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs">Room name</label>
            <input
              name="name"
              className="w-full bg-background border border-primary/20 rounded-md px-3 py-2"
              placeholder="New room"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs pb-2">Members</label>
            <div className="flex flex-wrap gap-2">
              {selectedUserIds.map((id) => (
                <span
                  key={id}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10"
                >
                  {options.find((o) => o.value === id)?.label || id}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserIds((prev) =>
                        prev.filter((userId) => userId !== id)
                      );
                    }}
                    className="cursor-pointer hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Combobox data={options} type="user">
              <ComboboxTrigger className="w-full justify-between" />
              <ComboboxContent>
                <ComboboxInput value={query} onValueChange={setQuery} />
                <ComboboxList>
                  <ComboboxEmpty>No users found.</ComboboxEmpty>
                  <ComboboxGroup>
                    {options.map((opt) => {
                      const isSelected = selectedUserIds.includes(opt.value);
                      return (
                        <ComboboxItem
                          key={opt.value}
                          value={opt.value}
                          onSelect={() => {
                            setSelectedUserIds((prev) =>
                              prev.includes(opt.value)
                                ? prev.filter((id) => id !== opt.value)
                                : [...prev, opt.value]
                            );
                          }}
                          className="flex items-center gap-2 cursor-pointer bg-[#0F0A1D]/90 hover:bg-[#0F0A1D]/80"
                        >
                          <Checkbox
                            checked={isSelected}
                            className="bg-[#0F0A1D]"
                          />
                          {opt.label}
                        </ComboboxItem>
                      );
                    })}
                  </ComboboxGroup>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <input
            type="hidden"
            name="members"
            value={selectedUserIds.join(",")}
          />
          <button
            disabled={isPending}
            className="cursor-pointer bg-primary text-background px-3 py-2 rounded-md w-full"
          >
            {isPending ? "Creating…" : "Create room"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
