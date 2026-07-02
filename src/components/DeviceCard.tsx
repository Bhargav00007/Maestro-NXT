"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Eye, Wifi, WifiOff, Activity, Server, Shield, Router, Database, HardDrive, Box } from "lucide-react";

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
  cpuUnits?: string;
  memoryUnits?: string;
}

interface HistoryItem {
  timestamp: string;
  cpu: number;
  memory: number;
  trafficIn: number;
  trafficOut: number;
}

interface DeviceCardProps {
  device: Device;
  history: HistoryItem[];
}

export default function DeviceCard({ device, history }: DeviceCardProps) {
  const router = useRouter();
  const statusColor = device.status === "up" ? "bg-green-500" : "bg-red-500";
  const statusText = device.status === "up" ? "Online" : "Offline";

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return String(timestamp);
    }
  };

  const getDeviceIcon = () => {
    switch (device.type) {
      case "router":
        return <Router className="h-4 w-4" />;
      case "switch":
        return <Server className="h-4 w-4" />;
      case "firewall":
        return <Shield className="h-4 w-4" />;
      case "database":
        return <Database className="h-4 w-4" />;
      case "storage":
        return <HardDrive className="h-4 w-4" />;
      case "loadbalancer":
        return <Activity className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  const getDeviceTypeColor = () => {
    switch (device.type) {
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

  const tooltipFormatter = (value: any, name?: string | number): [any, string] => {
    const nameStr = String(name || "");
    if (nameStr.toLowerCase() === "cpu") {
      return [`${value}%`, "CPU"];
    }
    if (nameStr.toLowerCase() === "memory") {
      return [`${value}%`, "Memory"];
    }
    return [value, nameStr];
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`${getDeviceTypeColor()}`}>{getDeviceIcon()}</div>
          <CardTitle className="text-sm font-medium truncate">
            {device.name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant="outline"
            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
          >
            Zabbix
          </Badge>
          {device.zabbixHostId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() =>
                router.push(`/zabbix/details?hostId=${device.zabbixHostId}`)
              }
              title="View in Zabbix"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`}
            />
            <span className="text-xs font-medium flex items-center gap-1">
              {device.status === "up" ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              {statusText}
            </span>
          </div>
          <div className="flex gap-3 text-xs">
            <span>
              CPU:{" "}
              <strong
                className={
                  device.cpu > 80
                    ? "text-red-500"
                    : device.cpu > 60
                    ? "text-yellow-500"
                    : "text-green-500"
                }
              >
                {device.cpu}
                {device.cpuUnits || "%"}
              </strong>
            </span>
            <span>
              Mem:{" "}
              <strong
                className={
                  device.memory > 85
                    ? "text-red-500"
                    : device.memory > 70
                    ? "text-yellow-500"
                    : "text-green-500"
                }
              >
                {device.memory}
                {device.memoryUnits || "%"}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>In: {device.trafficIn} Mbps</span>
          <span>Out: {device.trafficOut} Mbps</span>
        </div>

        {history.length > 1 && (
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  labelFormatter={formatTime}
                  contentStyle={{ fontSize: "10px" }}
                  formatter={tooltipFormatter}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="CPU"
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Memory"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2">
          <span>
            Type: <span className="capitalize">{device.type}</span>
          </span>
          <span>ID: {device.id.split("-").pop()}</span>
        </div>
      </CardContent>
    </Card>
  );
}