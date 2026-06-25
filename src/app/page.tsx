"use client";

import { useSidebar } from "@/components/sidebar";
import WorldMap from "@/components/WorldMap";
import DashboardCards from "@/components/DashboardCards";
import AlertsPanel from "@/components/AlertsPanel";
import { cn } from "@/lib/utils";

function HomeContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <h1 
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-4xl lg:text-4xl transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:ml-25" : "lg:ml-12"
          )}
        >
          Global Network
        </h1>
        <p 
          className={cn(
            "mt-1 text-sm text-muted-foreground sm:text-base transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:ml-25" : "lg:ml-12"
          )}
        >
          Connecting cities across the world
        </p>
      </header>

      <div 
        className={cn(
          "flex-1 p-3 sm:p-6 transition-all duration-300 ease-in-out",
          // When expanded: ml-25, when collapsed: ml-5
          !isCollapsed ? "md:ml-25" : "md:ml-12"
        )}
      >
        <div 
          className={cn(
            "mx-auto space-y-4 sm:space-y-6 transition-all duration-300 ease-in-out",
            // Adjust max-width based on sidebar state
            !isCollapsed ? "max-w-6xl" : "max-w-7xl"
          )}
        >
          <div className="grid h-[700px] gap-3 lg:h-[400px] lg:gap-6 lg:grid-cols-[3fr_1fr]">
            <div className="h-full min-h-0">
              <WorldMap />
            </div>
            <div className="h-full min-h-0">
              <AlertsPanel />
            </div>
          </div>

          <DashboardCards />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}