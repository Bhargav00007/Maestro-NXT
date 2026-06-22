"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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

interface DeviceCardProps {
  device: Device;
  history: HistoryItem[];
}

export default function DeviceCard({ device, history }: DeviceCardProps) {
  const statusColor = device.status === "up" ? "bg-green-500" : "bg-red-500";
  const statusText = device.status === "up" ? "Online" : "Offline";

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {device.name}
          <span className="ml-2 text-xs text-muted-foreground">
            {device.ip}
          </span>
        </CardTitle>
        <Badge variant="outline" className="capitalize">
          {device.type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`}
            />
            <span className="text-xs font-medium">{statusText}</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span>
              CPU: <strong>{device.cpu}%</strong>
            </span>
            <span>
              Mem: <strong>{device.memory}%</strong>
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
                  labelFormatter={(label) => formatTime(label as string)}
                  contentStyle={{ fontSize: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
