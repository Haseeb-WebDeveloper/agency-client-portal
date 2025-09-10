"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function QuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF] hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 mr-12 bg-[#1A0F2E] border-primary/20 text-foreground">
        {/* <DropdownMenuItem className="hover:bg-secondary focus:bg-secondary focus:text-accent-foreground cursor-pointer">
          <Link
            href="/admin/members/new"
            className="flex items-center gap-3 p-3"
          >
            <Image
              src="/icons/members.svg"
              alt="Add member"
              width={20}
              height={20}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Add member
              </span>
              <span className="text-xs text-foreground/90">
                Lorem ipsum dolor sit
              </span>
            </div>
          </Link>
        </DropdownMenuItem> */}
        <DropdownMenuItem className="hover:bg-secondary focus:bg-secondary focus:text-accent-foreground cursor-pointer">
          <Link
            href="/admin/offers/new"
            className="flex items-center gap-3 p-3"
          >
            <Image
              src="/icons/lists.svg"
              alt="Create offers"
              width={20}
              height={20}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Create offers
              </span>
              <span className="text-xs text-foreground/90">
                Lorem ipsum dolor sit
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-secondary focus:bg-secondary focus:text-accent-foreground cursor-pointer">
          <Link
            href="/admin/contracts/new"
            className="flex items-center gap-3 p-3"
          >
            <Image
              src="/icons/contracts.svg"
              alt="Create contract"
              width={20}
              height={20}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Create contract
              </span>
              <span className="text-xs text-foreground/90">
                Lorem ipsum dolor sit
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-secondary focus:bg-secondary focus:text-accent-foreground cursor-pointer">
          <Link href="/admin/news/edit/new" className="flex items-center gap-3 p-3">
            <Image
              src="/icons/notifications.svg"
              alt="Create news"
              width={20}
              height={20}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Create news post
              </span>
              <span className="text-xs text-foreground/90">
                Lorem ipsum dolor sit
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
