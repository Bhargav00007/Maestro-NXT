"use client";

import { useSidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export default function RegionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <h1 
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-4xl lg:text-4xl transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:ml-25" : "lg:ml-15"
          )}
        >
          Network Regions
        </h1>
        <p 
          className={cn(
            "mt-1 text-sm text-muted-foreground sm:text-base transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:ml-25" : "lg:ml-15"
          )}
        >
          Detailed view of regional devices
        </p>
      </header>

      <div 
        className={cn(
          "flex-1 p-3 sm:p-6 transition-all duration-300 ease-in-out",
          !isCollapsed ? "md:ml-25" : "md:ml-15"
        )}
      >
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
}