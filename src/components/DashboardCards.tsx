"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher/client";
import DeviceCard from "@/components/DeviceCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Device {
  id: string;
  name: string;
  ip: string;
  type: string;
  cpu: number;
  memory: number;
  status: "up" | "down";
  trafficIn: number;
  trafficOut: number;
  timestamp: string;
}

interface HistoryItem {
  timestamp: string;
  cpu: number;
  memory: number;
  trafficIn: number;
  trafficOut: number;
}

export default function DashboardCards() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryItem[]>>({});
  const [alerts, setAlerts] = useState<string[]>([]);

  const handleDeviceUpdate = (newDevices: Device[]) => {
    // Debug: log to verify data arrives and changes
    console.log("Received device data:", newDevices);

    setDevices(newDevices);

    setHistory((prev) => {
      const updated = { ...prev };
      newDevices.forEach((d) => {
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

    // Generate alerts
    const newAlerts: string[] = [];
    newDevices.forEach((d) => {
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
    setAlerts(newAlerts);
  };

  useEffect(() => {
    // Subscribe to Pusher
    const channel = pusherClient.subscribe("monitoring");
    channel.bind("device-updates", (data: Device[]) => {
      handleDeviceUpdate(data);
    });

    // Initial fetch to get data immediately
    fetch("/api/pusher/trigger")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) handleDeviceUpdate(json.data);
      })
      .catch(console.error);

    // Poll every 5 seconds to simulate fresh data (will be replaced by server cron later)
    const interval = setInterval(() => {
      fetch("/api/pusher/trigger")
        .then((res) => res.json())
        .then((json) => {
          if (json.success) handleDeviceUpdate(json.data);
        })
        .catch(console.error);
    }, 5000);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("monitoring");
      clearInterval(interval);
    };
  }, []);

  if (devices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading devices…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Device Health</h2>
        <span className="text-sm text-muted-foreground">
          Real-time monitoring
        </span>
      </div>

      {/* Alert Section – shows "No alerts" when empty */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            history={history[device.id] || []}
          />
        ))}
      </div>
      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Alert key={i} variant="destructive">
              <AlertTitle>Alert</AlertTitle>
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      ) : (
        <div className="rounded-md bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No alerts – all devices healthy
        </div>
      )}
    </div>
  );
}
