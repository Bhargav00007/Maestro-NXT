"use client";

import { useEffect, useState } from "react";
import { useDeviceStore } from "@/lib/store";
import DeviceCard from "@/components/DeviceCard";
import RegionCards from "@/components/regionCards";

interface HistoryItem {
  timestamp: string;
  cpu: number;
  memory: number;
  trafficIn: number;
  trafficOut: number;
}

export default function DashboardCards() {
  const devices = useDeviceStore((state) => state.devices);
  const [history, setHistory] = useState<Record<string, HistoryItem[]>>({});

  useEffect(() => {
    setHistory((prev) => {
      const updated = { ...prev };

      devices.forEach((d) => {
        const item: HistoryItem = {
          timestamp: d.timestamp,
          cpu: d.cpu,
          memory: d.memory,
          trafficIn: d.trafficIn,
          trafficOut: d.trafficOut,
        };

        if (!updated[d.id]) updated[d.id] = [];

        updated[d.id] = [...updated[d.id], item].slice(-30);
      });

      return updated;
    });
  }, [devices]);

  // Filter to show only the 6 main devices (default region)
  const mainDevices = devices.filter(d => d.region === "default");

  if (devices.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground sm:p-8">
        Loading devices...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold sm:text-2xl">Device Health</h2>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Real-time monitoring ({mainDevices.length} main devices)
        </span>
      </div>

      {/* Devices Grid - Only shows 6 main devices */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {mainDevices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            history={history[device.id] || []}
          />
        ))}
      </div>
    </div>
  );
}