"use client";

import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/sidebar";

import { cn } from "@/lib/utils";

import {
  Home,
  BookMarked,
  HardDrive,
  Search,
  ChevronsLeftRightEllipsis,
  AlertTriangle,
  Menu,
} from "lucide-react";

import Navbar from "@/components/Navbar";

interface MySidebarProps {
  children: React.ReactNode;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "About", url: "/about", icon: BookMarked },
  { title: "Devices", url: "/devices", icon: HardDrive },
  { title: "Search", url: "/search", icon: Search },
  { title: "Zabbix", url: "/zabbix", icon: ChevronsLeftRightEllipsis },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle },
];

function SidebarContentWrapper() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={`${BASE_PATH}${item.url}`}>
                    <item.icon />
                    <span className="transition-opacity duration-300">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <Sidebar
        collapsible="icon"
        className={cn(
          "transition-all duration-300 ease-in-out top-14",
          !isCollapsed && "w-30"
        )}
      >
        <SidebarContentWrapper />
      </Sidebar>

      <div className="flex min-h-screen flex-1 flex-col transition-all duration-500 ease-in-out">
        <Navbar />

        <div className="fixed left-4 top-4">
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </div>

        <main
          className={cn(
            "flex-1 overflow-auto px-4 pt-14 transition-all duration-300 ease-in-out",
            !isCollapsed && "md:ml-[4rem]"
          )}
        >
          {children}
        </main>
      </div>
    </>
  );
}

export function MySidebar({ children }: MySidebarProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarLayout>{children}</SidebarLayout>
    </SidebarProvider>
  );
}