"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { adminSidebarItems, clientSidebarItems } from "@/constants/navigation";
import { MenuIcon, Search } from "lucide-react";
import { useCallback } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/clients";

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleLogout = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  const items = useMemo(
    () =>
      user.role === "PLATFORM_ADMIN" || user.role === "AGENCY_MEMBER"
        ? adminSidebarItems
        : clientSidebarItems,
    [user.role]
  );

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
          <div className="flex items-center space-x-2 mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={200}
              sizes="@media (max-width: 768px) {
                width: 100px;
                height: 100px;
              }"
              className="object-contain h-12 w-auto"
            />
          </div>
          <nav className="space-y-2 flex-1">
            {items.map((item) => {
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
                      width={100}
                      height={100}
                      className="w-5 h-5 "
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="pr-3">
            <div className="w-full h-[1px] bg-sidebar-border"></div>
            <Link
              href={user.role === "PLATFORM_ADMIN" || user.role === "AGENCY_MEMBER" ? "/admin/profile" : "/client/profile"}
              className="py-4 pl-4 flex items-center gap-3 hover:bg-sidebar-accent/20 rounded-lg transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={user.avatar || ""}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  {user.firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground block truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-sidebar-foreground/70">
                  View Profile
                </span>
              </div>
            </Link>
          </div>
        </div>
      ),
    [items, pathname, user.avatar, user.firstName, user.lastName, user.role, handleNavigation]
  );

  return (
    <div className="min-h-screen h-full bg-gradient-to-b from-[#0A031C] to-[#000000] text-foreground">
      {/* <Suspense fallback={null}><GlobalLoading /></Suspense> */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>
      <div className="flex min-h-screen h-full">
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:h-screen lg:fixed lg:left-0 lg:top-0 lg:z-10">
          <SidebarContent />
        </div>
        <div className="flex-1 h-full flex flex-col overflow-hidden lg:ml-64">
          <header
            className="bg-[#00000066] px-4 py-4 lg:px-12"
            style={{ borderTopLeftRadius: !isMobile ? "70px" : "0px" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <MenuIcon className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
                <div className="relative w-full lg:min-w-[70%]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground" />
                  <input
                    placeholder="Search"
                    className={`pl-10 w-[100%] bg-transparent border border-primary/40 rounded-full text-foreground placeholder:text-foreground px-2 py-2 ${
                      isMobile ? "text-sm" : ""
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* <div className="relative flex items-center justify-center w-fit h-fit">
                  <Image
                    src="/icons/notification.svg"
                    alt="Notification"
                    width={20}
                    height={20}
                    className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`}
                    style={{ width: "auto", height: "auto" }}
                  />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs"></span>
                </div> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-primary/40"
                >
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <main className={`bg-[#0F0A1D] min-h-[calc(100vh-75px)]`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
