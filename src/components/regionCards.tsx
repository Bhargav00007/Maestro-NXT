"use client";

import { useRouter } from "next/navigation";
import { useDeviceStore } from "@/lib/store";
import { Activity, Server, Wifi, HardDrive, Shield, Database } from "lucide-react";

interface RegionCardProps {
  region: string;
  title: string;
  icon: React.ReactNode;
  devices: any[];
  color: string;
  path: string;
}

function RegionCard({ region, title, icon, devices, color, path }: RegionCardProps) {
  const router = useRouter();

  const totalDevices = devices.length;
  const upDevices = devices.filter(d => d.status === "up").length;
  const downDevices = totalDevices - upDevices;

  const avgCpu = totalDevices > 0
    ? Math.round(devices.reduce((sum, d) => sum + d.cpu, 0) / totalDevices)
    : 0;
  const avgMemory = totalDevices > 0
    ? Math.round(devices.reduce((sum, d) => sum + d.memory, 0) / totalDevices)
    : 0;

  const deviceTypes: Record<string, number> = {};
  devices.forEach(d => {
    deviceTypes[d.type] = (deviceTypes[d.type] || 0) + 1;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'router': return <Wifi className="h-3 w-3" />;
      case 'switch': return <Server className="h-3 w-3" />;
      case 'firewall': return <Shield className="h-3 w-3" />;
      case 'loadbalancer': return <Activity className="h-3 w-3" />;
      case 'storage': return <HardDrive className="h-3 w-3" />;
      case 'database': return <Database className="h-3 w-3" />;
      default: return <Server className="h-3 w-3" />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-full p-2 ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground capitalize">{region}</p>
          </div>
        </div>
        <button
          onClick={() => router.push(path)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-gray-500 hover:border-primary"
        >
          View 
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold">{totalDevices}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{upDevices}</p>
          <p className="text-[10px] text-muted-foreground">Up</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-600">{downDevices}</p>
          <p className="text-[10px] text-muted-foreground">Down</p>
        </div>
      </div>

      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex-1">
          <p className="text-muted-foreground">Avg CPU</p>
          <p className="font-semibold">{avgCpu}%</p>
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground">Avg Memory</p>
          <p className="font-semibold">{avgMemory}%</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Device Types</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(deviceTypes).map(([type, count]) => (
            <span key={type} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]">
              {getTypeIcon(type)}
              {count}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex gap-0.5 overflow-hidden">
        {devices.slice(0, 20).map((device, idx) => (
          <div
            key={idx}
            className={`h-1.5 w-1.5 rounded-full ${device.status === "up" ? "bg-green-500" : "bg-red-500"}`}
            title={`${device.name}: ${device.status}`}
          />
        ))}
        {devices.length > 20 && (
          <span className="text-[8px] text-muted-foreground ml-1">+{devices.length - 20}</span>
        )}
      </div>
    </div>
  );
}

export default function RegionCards() {
  const devices = useDeviceStore((state) => state.devices);

  const regions = {
    culpepper: {
      title: "Culpepper",
      region: "culpepper",
      color: "bg-green-100 text-green-600",
      icon: <Server className="h-4 w-4" />,
      devices: devices.filter(d => d.region === "culpepper"),
      path: "/culpepper"
    },
    plainsboro: {
      title: "Plainsboro",   
      region: "plainsboro",
      color: "bg-purple-100 text-purple-600",
      icon: <Database className="h-4 w-4" />,
      devices: devices.filter(d => d.region === "plainsboro"),
      path: "/plainsboro"
    },
    hyderabad: {
      title: "Hyderabad",
      region: "hyderabad",
      color: "bg-orange-100 text-orange-600",
      icon: <Activity className="h-4 w-4" />,
      devices: devices.filter(d => d.region === "hyderabad"),
      path: "/hyderabad"
    }
  };

  const defaultDevices = devices.filter(d => d.region === "default");
  const hasDefaultDevices = defaultDevices.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Device Regions</h2>
        <span className="text-xs text-muted-foreground">
          {devices.length} total devices
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(regions).map((region) => (
          <RegionCard key={region.region} {...region} />
        ))}
      </div>

     
    </div>
  );
}