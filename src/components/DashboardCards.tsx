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
    const channel = pusherClient.subscribe("monitoring");

    channel.bind("device-updates", (data: Device[]) => {
      handleDeviceUpdate(data);
    });

    fetch("/api/pusher/trigger")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) handleDeviceUpdate(json.data);
      })
      .catch(console.error);

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
        Loading devices...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Device Health</h2>

        <span className="text-sm text-muted-foreground">
          Real-time monitoring
        </span>
      </div>

      {/* Devices */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            history={history[device.id] || []}
          />
        ))}
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Alerts</h3>

          <span className="text-sm text-muted-foreground">
            {alerts.length} Active
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <Alert key={index} variant="destructive">
                <AlertTitle>Warning</AlertTitle>
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
    </div>
  );
}
