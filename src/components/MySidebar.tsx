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
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/sidebar";

import { pixelFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import {
  User,
  ChevronsUpDown,
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Menu,
} from "lucide-react";

interface MySidebarProps {
  children: React.ReactNode;
}

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "About",
    url: "/about",
    icon: Inbox,
  },
  {
    title: "Devices",
    url: "/devices",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Packets",
    url: "/packets",
    icon: Settings,
  },
];

function SidebarContentWrapper() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-4 mt-7">
            {!isCollapsed ? (
              <h1 className="text-lg font-semibold transition-opacity duration-300">
                MAESTRO{" "}
                <span className={`${pixelFont.className} text-xs`}>NXT</span>
              </h1>
            ) : (
              <div className="flex justify-center">
                <span className={`${pixelFont.className} text-xs`}>MN</span>
              </div>
            )}
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
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

      
    </>
  );
}

// This component wraps everything in SidebarProvider
function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <Sidebar collapsible="icon" className="transition-all duration-300 ease-in-out">
        <SidebarContentWrapper />
      </Sidebar>

      <div className="flex min-h-screen flex-1 flex-col transition-all duration-500 ease-in-out">
        <div className="sticky top-0 z-50 flex items-center px-4 mt-4">
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </div>

        <main
          className={cn(
            "flex-1 overflow-auto px-4 transition-all duration-300 ease-in-out",
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