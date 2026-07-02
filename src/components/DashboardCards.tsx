"use client";

import { useEffect, useState } from "react";
import { useDeviceStore } from "@/lib/store";
import DeviceCard from "@/components/DeviceCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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
  const [visibleCount, setVisibleCount] = useState(6);
  const PAGE_SIZE = 6;

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

  // All devices (no region filter)
  const allDevices = devices;

  // Paginated devices
  const visibleDevices = allDevices.slice(0, visibleCount);
  const hasMore = visibleCount < allDevices.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allDevices.length));
  };

  if (devices.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground sm:p-8">
        Loading devices...
      </div>
    );
  }

  const upCount = allDevices.filter((d) => d.status === "up").length;
  const downCount = allDevices.filter((d) => d.status === "down").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-2xl">Device Health</h2>
          <p className="text-xs text-muted-foreground">
            {allDevices.length} devices • {upCount} online • {downCount} offline
            {allDevices.length > PAGE_SIZE && (
              <span className="ml-2 text-muted-foreground/60">
                (showing {visibleDevices.length})
              </span>
            )}
          </p>
        </div>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Real-time monitoring
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {visibleDevices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            history={history[device.id] || []}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            className="flex items-center gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Load More ({Math.min(PAGE_SIZE, allDevices.length - visibleCount)} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}