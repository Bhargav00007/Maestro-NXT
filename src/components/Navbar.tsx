"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { useSidebar, SidebarTrigger } from "@/components/sidebar";
import { pixelFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <nav
      className={cn(
        "fixed top-0 z-40 h-14 w-full border-b bg-sidebar backdrop-blur-sm transition-all duration-300 ease-in-out flex items-center px-4",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          <h1 className="text-xl font-semibold transition-opacity duration-300">
              MAESTRO{" "}
              <span className={`${pixelFont.className} text-xs`}>NXT</span>
            </h1>
        </div>
        <Link
          href="/alerts"
          className="text-muted-foreground hover:text-foreground transition-colors lg:mr-15 "
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </nav>
  );
}