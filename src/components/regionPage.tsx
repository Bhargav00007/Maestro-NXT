"use client";

import { useRouter } from "next/navigation";
import { useDeviceStore } from "@/lib/store";
import { ArrowLeft, Activity, Server, Wifi, HardDrive, Shield, Database } from "lucide-react";
import DeviceCard from "@/components/DeviceCard";
import { useEffect, useState, useMemo } from "react";

interface HistoryItem {
  timestamp: string;
  cpu: number;
  memory: number;
  trafficIn: number;
  trafficOut: number;
}

interface RegionPageProps {
  region: string;
  title: string;
  icon: React.ReactNode;
  color: string;
}

export default function RegionPage({ region, title, icon, color }: RegionPageProps) {
  const router = useRouter();
  const devices = useDeviceStore((state) => state.devices);
  const [history, setHistory] = useState<Record<string, HistoryItem[]>>({});

  const regionDevices = useMemo(() => {
    return devices.filter(d => d.region === region);
  }, [devices, region]);

  useEffect(() => {
    const updated = { ...history };
    let hasChanges = false;

    regionDevices.forEach((d) => {
      const item: HistoryItem = {
        timestamp: d.timestamp,
        cpu: d.cpu,
        memory: d.memory,
        trafficIn: d.trafficIn,
        trafficOut: d.trafficOut,
      };

      if (!updated[d.id]) {
        updated[d.id] = [];
        hasChanges = true;
      }

      const lastItem = updated[d.id][updated[d.id].length - 1];
      if (!lastItem || lastItem.timestamp !== d.timestamp) {
        updated[d.id] = [...updated[d.id], item].slice(-30);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setHistory(updated);
    }
  }, [regionDevices, history]);

  const totalDevices = regionDevices.length;
  const upDevices = regionDevices.filter(d => d.status === "up").length;
  const downDevices = totalDevices - upDevices;
  
  const avgCpu = totalDevices > 0 
    ? Math.round(regionDevices.reduce((sum, d) => sum + d.cpu, 0) / totalDevices) 
    : 0;
  const avgMemory = totalDevices > 0 
    ? Math.round(regionDevices.reduce((sum, d) => sum + d.memory, 0) / totalDevices) 
    : 0;

  const deviceTypes: Record<string, number> = {};
  regionDevices.forEach(d => {
    deviceTypes[d.type] = (deviceTypes[d.type] || 0) + 1;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'router': return <Wifi className="h-4 w-4" />;
      case 'switch': return <Server className="h-4 w-4" />;
      case 'firewall': return <Shield className="h-4 w-4" />;
      case 'loadbalancer': return <Activity className="h-4 w-4" />;
      case 'storage': return <HardDrive className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading devices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${color}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{region} Region</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Devices</p>
          <p className="text-2xl font-bold">{totalDevices}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Devices Up</p>
          <p className="text-2xl font-bold text-green-600">{upDevices}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Devices Down</p>
          <p className="text-2xl font-bold text-red-600">{downDevices}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg CPU / Memory</p>
          <p className="text-xl font-bold">{avgCpu}% / {avgMemory}%</p>
        </div>
      </div>

      {/* Device Types */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Device Types</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(deviceTypes).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              {getTypeIcon(type)}
              <span className="text-sm font-medium capitalize">{type}</span>
              <span className="text-sm text-muted-foreground">({count})</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">All Devices in {title}</h3>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {regionDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              history={history[device.id] || []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}