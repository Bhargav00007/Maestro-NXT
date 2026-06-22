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
} from "@/components/sidebar";

import { pixelFont } from "@/lib/fonts";

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
    title: "Inbox",
    url: "/inbox",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function MySidebar({ children }: MySidebarProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <div className="px-3 py-4">
              <h1 className="text-lg font-semibold">
                MAESTRO{" "}
                <span className={`${pixelFont.className} text-xs`}>NXT</span>
              </h1>
            </div>

            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenuButton size="lg">
            <User className="h-4 w-4" />

            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">John Doe</span>

              <span className="text-xs text-muted-foreground">
                john@example.com
              </span>
            </div>

            <ChevronsUpDown className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-50 flex h-14 items-center px-4 md:hidden">
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </div>

        <main
          className="
            flex-1
            overflow-auto
            
            md:ml-[11rem]
          "
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
