"use client";

import { useEffect, useState } from "react";
import { useDeviceStore } from "@/lib/store";
import DeviceCard from "@/components/DeviceCard";

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

  // Only show Zabbix devices
  const zabbixDevices = devices.filter((d) => d.region === "zabbix");

  if (devices.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground sm:p-8">
        Loading devices...
      </div>
    );
  }

  if (zabbixDevices.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No Zabbix devices found</p>
      </div>
    );
  }

  const upCount = zabbixDevices.filter((d) => d.status === "up").length;
  const downCount = zabbixDevices.filter((d) => d.status === "down").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-2xl">Device Health</h2>
          <p className="text-xs text-muted-foreground">
            {zabbixDevices.length} devices • {upCount} online • {downCount} offline
          </p>
        </div>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Real-time monitoring
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {zabbixDevices.map((device) => (
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