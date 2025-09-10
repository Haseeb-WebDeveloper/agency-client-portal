"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  MessageSquareIcon,
  NewspaperIcon,
  SearchIcon,
  BellIcon,
  MenuIcon,
  Search,
} from "lucide-react";
import { adminSidebarItems } from "@/constants/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleNavigation = useCallback(
    (href: string, e: React.MouseEvent) => {
      e.preventDefault();
      router.push(href);
      if (isMobile) {
        setSidebarOpen(false);
      }
    },
    [router, isMobile]
  );

  const SidebarContent = useMemo(
    () => () =>
      (
        <div className="pl-3 py-4 h-full flex flex-col bg-gradient-to-b from-[#0A031C] to-[#000000] bg-sidebar ">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={200}
              className="object-contain h-12"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {adminSidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={`cursor-pointer w-full flex items-center justify-between px-6 py-3.5 border-0 shadow-none text-sm rounded-l-full transition-colors dark:text-foreground text-background ${
                    isActive
                      ? "bg-gradient-to-r from-[#6B42D1] to-[#FF2AFF]"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src={`/icons/${item.icon}`}
                      alt={item.label}
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* divider   */}

          {/* User Profile */}
          <div className="pr-3">
            <div className="w-full h-[1px] bg-sidebar-border"></div>
            <div className="py-4 pl-4 flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={user.avatar || ""}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  {user.firstName.charAt(0)}
                  {/* {user.lastName.charAt(0)} */}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-sidebar-foreground">
                {user.firstName}
              </span>
            </div>
          </div>
        </div>
      ),
    [pathname, user.avatar, user.firstName, handleNavigation]
  );

  return (
    <div className="min-h-screen h-full bg-gradient-to-b from-[#0A031C] to-[#000000] text-foreground">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen h-full">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:h-screen lg:fixed lg:left-0 lg:top-0 lg:z-10">
          <SidebarContent />
        </div>

        {/* Main content */}
        <div className="flex-1 h-full flex flex-col overflow-hidden lg:ml-64">
          {/* Top navbar */}
          <header
            className="bg-[#00000066] px-4 py-4 lg:px-12"
            style={{
              borderTopLeftRadius: !isMobile ? "70px" : "0px",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <MenuIcon className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>

                {/* Search */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground" />
                  <input
                    placeholder="Search"
                    className={`pl-10 w-[100%] bg-transparent border border-primary/40 rounded-full text-foreground placeholder:text-foreground px-2 py-2 ${
                      isMobile ? "text-sm" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Notifications */}
              <div className="relative flex items-center justify-center w-fit h-fit">
                <Image
                  src="/icons/notification.svg"
                  alt="Notification"
                  width={20}
                  height={20}
                  className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`}
                />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs"></span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main
            className={`${
              isMobile ? "px-4 py-6" : "px-12 py-8"
            } bg-[#0F0A1D] h-full min-h-[calc(100vh-68px)]`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
