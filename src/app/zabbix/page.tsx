"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDeviceStore } from "@/lib/store";
import {
  Loader2,
  Server,
  Activity,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Router,
  Shield,
  Database,
  HardDrive,
  Box,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ZabbixPage() {
  const router = useRouter();
  const devices = useDeviceStore((state) => state.devices);
  const [error, setError] = useState<string | null>(null);
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const zabbixDevices = devices;

  const getStatusBadge = (status?: string) => {
    if (status === "up" || status === "0") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          Online
        </Badge>
      );
    }
    if (status === "down" || status === "1") {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        Unknown
      </Badge>
    );
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "router":
        return <Router className="h-5 w-5" />;
      case "switch":
        return <Server className="h-5 w-5" />;
      case "firewall":
        return <Shield className="h-5 w-5" />;
      case "database":
        return <Database className="h-5 w-5" />;
      case "storage":
        return <HardDrive className="h-5 w-5" />;
      case "loadbalancer":
        return <Box className="h-5 w-5" />;
      default:
        return <Box className="h-5 w-5" />;
    }
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case "router":
        return "text-blue-500";
      case "switch":
        return "text-green-500";
      case "firewall":
        return "text-red-500";
      case "database":
        return "text-purple-500";
      case "storage":
        return "text-yellow-500";
      case "loadbalancer":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl xl:max-w-full xl:px-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zabbix Devices</h1>
          <p className="text-sm text-muted-foreground">
            {zabbixDevices.length} devices monitored
          </p>
        </div>
        <a href="/zabbixtest">
          Raw data
        </a>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {zabbixDevices.length === 0 ? (
        <div className="text-center py-12">
          <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No Zabbix devices found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zabbixDevices.map((device) => (
            <Card
              key={device.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
              onClick={() => router.push(`${BASE_PATH}/zabbix/details?hostId=${device.zabbixHostId}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={getDeviceTypeColor(device.type)}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <CardTitle className="text-sm font-medium truncate">
                    {device.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {device.region && device.region !== "default" && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {device.region}
                    </Badge>
                  )}
                  {getStatusBadge(device.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground text-xs">CPU</span>
                      <p
                        className={`font-semibold ${
                          device.cpu > 80
                            ? "text-red-500"
                            : device.cpu > 60
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {device.cpu}{device.cpuUnits || "%"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Memory</span>
                      <p
                        className={`font-semibold ${
                          device.memory > 85
                            ? "text-red-500"
                            : device.memory > 70
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {device.memory}{device.memoryUnits || "%"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground text-xs">IP</span>
                    <p className="text-xs font-mono">{device.ip}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>Type: {device.type}</span>
                  <div className="flex items-center gap-1 text-primary">
                    <Eye className="h-3 w-3" />
                    <span>View Details</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}