"use client";

import { useSidebar } from "@/components/sidebar";
import WorldMap from "@/components/WorldMap";
import DashboardCards from "@/components/DashboardCards";
import AlertsPanel from "@/components/AlertsPanel";
import RegionCards from "@/components/regionCards";
import { cn } from "@/lib/utils";
import DashboardStats from "@/components/DashboardStats";
import RegionHealthPieCharts from "@/components/DashboardCharts";

function HomeContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5 ">
        <h1 
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-4xl lg:text-4xl transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:ml-15" : "lg:ml-15"
          )}
        >
          Global Network
        </h1>
        <p 
          className={cn(
            "mt-1 text-sm text-muted-foreground sm:text-base transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:ml-15" : "lg:ml-15"
          )}
        >
          Connecting cities across the world
        </p>
      </header>

      <div 
        className={cn(
          "flex-1 p-3 sm:p-6 transition-all duration-300 ease-in-out",
          !isCollapsed ? "md:ml-15" : "md:ml-15"
        )}
      >
        <div 
          className={cn(
            "mx-auto space-y-4 sm:space-y-6 transition-all duration-300 ease-in-out",
            !isCollapsed ? "lg:max-w-6xl xl:max-w-7xl" : "lg:max-w-7xl xl:max-w-9xl"
          )}
        >
          <div className="flex flex-col gap-3 lg:gap-6 lg:grid lg:grid-cols-[3fr_1fr]">
            <div className="h-[400px] sm:h-[500px] lg:h-[400px] min-h-0">
              <div className="h-full rounded-lg border border-gray-300 shadow-md overflow-auto bg-card">
                <WorldMap />
              </div>
            </div>
            
            <div className="h-[300px] sm:h-[350px] lg:h-[400px] min-h-0">
              <div className="h-full rounded-lg border border-gray-300  shadow-md overflow-auto bg-card">
                <AlertsPanel />
              </div>
            </div>
          </div>
<div className="rounded-lg border border-gray-300  shadow-md overflow-hidden bg-card p-4">
<DashboardStats/>          </div>
          <div className="rounded-lg border border-gray-300  shadow-md overflow-hidden bg-card p-4">
            <DashboardCards />
          </div>
          <div className="rounded-lg border border-gray-300  shadow-md overflow-hidden bg-card p-4">
            <RegionHealthPieCharts />
          </div>
          <div className="rounded-lg border border-gray-300  shadow-md overflow-hidden bg-card p-4">
            <RegionCards />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}