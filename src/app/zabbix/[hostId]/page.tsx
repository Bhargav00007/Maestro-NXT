"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeviceStore } from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Activity,
  Server,
  Shield,
  Router,
  Database,
  HardDrive,
  Box,
  Cpu,
  MemoryStick,
  Network,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DeviceDetail {
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
}

export default function ZabbixDeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hostId = params?.hostId as string;
  const devices = useDeviceStore((state) => state.devices);
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("🔍 HostId:", hostId);
  console.log("🔍 Devices in store:", devices);

  useEffect(() => {
    if (!hostId) {
      setError("No host ID provided");
      setLoading(false);
      return;
    }

    // Find device in store
    const foundDevice = devices.find((d) => d.zabbixHostId === hostId);
    console.log("🔍 Found device:", foundDevice);
    
    if (foundDevice) {
      setDevice(foundDevice as DeviceDetail);
    } else {
      // Try to find by ID with prefix
      const prefixedId = `zabbix-${hostId}`;
      const foundByPrefixed = devices.find((d) => d.id === prefixedId);
      if (foundByPrefixed) {
        setDevice(foundByPrefixed as DeviceDetail);
      }
    }

    fetchDeviceData();
  }, [hostId, devices]);

  const fetchDeviceData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch items
      const itemsResponse = await fetch(`/api/zabbix?action=items&hostId=${hostId}`);
      const itemsData = await itemsResponse.json();
      
      console.log("📦 Items response:", itemsData);

      if (itemsData.success && itemsData.data) {
        // Find CPU and Memory items
        const cpuItem = itemsData.data.find(
          (item: any) =>
            item.key_ === "system.cpu.util" ||
            item.key_.includes("cpu.utilization")
        );
        const memItem = itemsData.data.find(
          (item: any) =>
            item.key_ === "vm.memory.util" ||
            item.key_.includes("memory.utilization")
        );

        // Update device with latest values
        if (cpuItem && cpuItem.lastvalue && device) {
          const updated = { ...device };
          updated.cpu = Math.round(parseFloat(cpuItem.lastvalue));
          updated.cpuUnits = cpuItem.units || "%";
          setDevice(updated);
        }

        if (memItem && memItem.lastvalue && device) {
          const updated = { ...device };
          updated.memory = Math.round(parseFloat(memItem.lastvalue));
          updated.memoryUnits = memItem.units || "%";
          setDevice(updated);
        }

        // Fetch history for CPU
        if (cpuItem) {
          const cpuHistory = await fetch(`/api/zabbix?action=history&itemId=${cpuItem.itemid}`);
          const cpuData = await cpuHistory.json();
          
          if (cpuData.success && cpuData.data) {
            const historyData: HistoryItem[] = cpuData.data.map((item: any) => ({
              timestamp: new Date(Number(item.clock) * 1000).toISOString(),
              cpu: Math.round(parseFloat(item.value)),
              memory: 0,
            }));
            setHistory(historyData);
          }
        }

        // Add memory to history
        if (memItem) {
          const memHistory = await fetch(`/api/zabbix?action=history&itemId=${memItem.itemid}`);
          const memData = await memHistory.json();
          
          if (memData.success && memData.data) {
            setHistory((prev) => {
              const updated = [...prev];
              memData.data.forEach((item: any) => {
                const timestamp = new Date(Number(item.clock) * 1000).toISOString();
                const existing = updated.find((h) => h.timestamp === timestamp);
                if (existing) {
                  existing.memory = Math.round(parseFloat(item.value));
                } else {
                  updated.push({
                    timestamp,
                    cpu: 0,
                    memory: Math.round(parseFloat(item.value)),
                  });
                }
              });
              return updated.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              ).slice(-30);
            });
          }
        }
      }
    } catch (err) {
      console.error("❌ Error fetching device data:", err);
      setError("Failed to load device data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  const getStatusBadge = () => {
    if (!device) return null;
    const isUp = device.status === "up";
    return (
      <Badge className={isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
        {isUp ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {isUp ? "Online" : "Offline"}
      </Badge>
    );
  };

  const getDeviceIcon = () => {
    if (!device) return <Box className="h-8 w-8" />;
    switch (device.type) {
      case "router": return <Router className="h-8 w-8" />;
      case "switch": return <Server className="h-8 w-8" />;
      case "firewall": return <Shield className="h-8 w-8" />;
      case "database": return <Database className="h-8 w-8" />;
      case "storage": return <HardDrive className="h-8 w-8" />;
      default: return <Box className="h-8 w-8" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading device details...</p>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-500">Error Loading Device</h3>
          <p className="text-muted-foreground mt-2">{error || "Device not found"}</p>
          <p className="text-sm text-muted-foreground mt-1">Host ID: {hostId}</p>
          <Button onClick={() => router.push("/zabbix")} className="mt-4">
            Back to Zabbix
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/zabbix")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-primary">{getDeviceIcon()}</div>
            <div>
              <h1 className="text-2xl font-bold">{device.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{device.ip}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  {device.type}
                </Badge>
                <span>•</span>
                <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Zabbix
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button variant="outline" size="sm" onClick={fetchDeviceData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">{device.cpu}{device.cpuUnits || "%"}</p>
              </div>
              <Cpu className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="text-2xl font-bold">{device.memory}{device.memoryUnits || "%"}</p>
              </div>
              <MemoryStick className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Traffic In</p>
                <p className="text-2xl font-bold">{device.trafficIn} Mbps</p>
              </div>
              <Network className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Traffic Out</p>
                <p className="text-2xl font-bold">{device.trafficOut} Mbps</p>
              </div>
              <Network className="h-8 w-8 text-muted-foreground rotate-180" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPU Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            CPU Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
                    formatter={(value: any) => [`${value}%`, "CPU"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p>No CPU history data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memory Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MemoryStick className="h-4 w-4" />
            Memory Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
                    formatter={(value: any) => [`${value}%`, "Memory"]}
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
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p>No memory history data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combined Chart */}
      {history.length > 0 && history.some(h => h.cpu > 0 && h.memory > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Combined Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTime}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}