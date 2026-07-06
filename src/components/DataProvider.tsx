"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher/client";
import { useDeviceStore } from "@/lib/store";

interface Device {
  id: string;
  name: string;
  ip: string;
  type: string;
  region: string;
  cpu: number;
  memory: number;
  status: "up" | "down";
  trafficIn: number;
  trafficOut: number;
  timestamp: string;
  zabbixHostId?: string;
  cpuUnits: string; 
  memoryUnits: string; 
}

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const setDevices = useDeviceStore((state) => state.setDevices);
  const [isConnected, setIsConnected] = useState(false);

  const handleDeviceUpdate = (newDevices: Device[]) => {
    console.log("DataProvider received data:", newDevices.length, "devices");
    
    const devicesWithUnits = newDevices.map(device => ({
      ...device,
      cpuUnits: device.cpuUnits || "%",
      memoryUnits: device.memoryUnits || "%",
    }));
    
    setDevices(devicesWithUnits);
  };

  const fetchInitialData = async () => {
    try {
      const response = await fetch("/api/pusher/trigger");
      const json = await response.json();
      
      if (json.success && json.data) {
        console.log("Initial data loaded:", json.data.length, "devices");
        handleDeviceUpdate(json.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await fetchInitialData();

      if (isMounted) {
        const channel = pusherClient.subscribe("monitoring");

        channel.bind("device-updates", (data: Device[]) => {
          console.log("Pusher real-time update received:", data?.length || 0, "devices");
          if (data && data.length > 0) {
            handleDeviceUpdate(data);
          }
        });

        setIsConnected(true);
        console.log("Pusher connected and listening for updates");

        const interval = setInterval(async () => {
          if (!isMounted) return;
          
          try {
            const response = await fetch("/api/pusher/trigger");
            const json = await response.json();
            if (json.success && json.data) {
              handleDeviceUpdate(json.data);
            }
          } catch (error) {
            console.error("Interval fetch failed:", error);
          }
        }, 30000); 

        return () => {
          isMounted = false;
          clearInterval(interval);
          channel.unbind_all();
          pusherClient.unsubscribe("monitoring");
        };
      }
    };

    initialize();
  }, [setDevices]);

  return <>{children}</>;
}