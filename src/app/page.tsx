import WorldMap from "@/components/WorldMap";
import DashboardCards from "@/components/DashboardCards";
import AlertsPanel from "@/components/AlertsPanel";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl lg:text-4xl">
          Global Network
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Connecting cities across the world
        </p>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          {/* Map + Alerts Side by Side - Fixed height */}
          <div className="grid h-[700px] gap-3 lg:h-[400px] lg:gap-6 lg:grid-cols-[3fr_1fr]">
            <div className="h-full min-h-0">
              <WorldMap />
            </div>
            <div className="h-full min-h-0">
              <AlertsPanel />
            </div>
          </div>

          {/* Device Health below */}
          <DashboardCards />
        </div>
      </div>
    </div>
  );
}