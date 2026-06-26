"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher/client";
import { useDeviceStore } from "@/lib/store";

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
  region: string;
}

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const setDevices = useDeviceStore((state) => state.setDevices);

  const handleDeviceUpdate = (newDevices: Device[]) => {
    console.log("DataProvider received data:", newDevices);
    setDevices(newDevices);
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
  }, [setDevices]);

  return <>{children}</>;
}