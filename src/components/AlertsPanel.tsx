"use client";

import { useEffect, useState } from "react";
import { useDeviceStore } from "@/lib/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, BellOff } from "lucide-react";

export default function AlertsPanel() {
  const devices = useDeviceStore((state) => state.devices);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const newAlerts: string[] = [];

    devices.forEach((d) => {
      if (d.status === "down") {
        newAlerts.push(`${d.name} is DOWN`);
      }

      if (d.cpu > 80) {
        newAlerts.push(`${d.name} CPU high: ${d.cpu}%`);
      }

      if (d.memory > 85) {
        newAlerts.push(`${d.name} Memory high: ${d.memory}%`);
      }
    });

    console.log("AlertsPanel generated alerts:", newAlerts);
    setAlerts(newAlerts);
  }, [devices]);

  const isConnected = devices.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 border-b px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {alerts.length > 0 ? (
              <Bell className="h-3 w-3 text-destructive sm:h-4 sm:w-4" />
            ) : (
              <BellOff className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
            )}
            <h3 className="text-xs font-semibold sm:text-sm">Alerts</h3>
            {isConnected && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500 sm:ml-2" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground sm:text-xs">
            {alerts.length} Active
          </span>
        </div>
      </div>

      {/* Scrollable Alerts List - Takes remaining height */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
        {alerts.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {alerts.map((alert, index) => (
              <Alert key={index} variant="destructive" className="text-[10px] sm:text-xs">
                <AlertTitle className="text-[10px] font-semibold sm:text-xs">
                  Alert
                </AlertTitle>
                <AlertDescription className="text-[10px] sm:text-xs">
                  {alert}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-md bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground sm:px-4 sm:py-3 sm:text-sm">
              All devices healthy
              <div className="mt-0.5 text-[10px] text-muted-foreground/60 sm:mt-1 sm:text-xs">
                No active alerts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}