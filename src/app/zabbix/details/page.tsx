"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDeviceStore } from "@/lib/store";
import { pusherClient } from "@/lib/pusher/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
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
  RefreshCw,
  Zap,
  Gauge,
  Terminal,
  Copy,
  Check,
  X,
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

interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue?: string;
  units?: string;
  status?: string;
}

export default function ZabbixDeviceDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hostId = searchParams.get("hostId");
  const devices = useDeviceStore((state) => state.devices);
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [items, setItems] = useState<ZabbixItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const historyRef = useRef<HistoryItem[]>([]);
  const deviceRef = useRef<DeviceDetail | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ping modal state
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<string>("");
  const [pingError, setPingError] = useState<string | null>(null);
  const [pingCopied, setPingCopied] = useState(false);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  // Find device in store
  useEffect(() => {
    if (!hostId) {
      setError("No host ID provided");
      return;
    }
    const found = devices.find((d) => d.zabbixHostId === hostId);
    if (found) setDevice(found as DeviceDetail);
    else {
      const prefixed = `zabbix-${hostId}`;
      const byId = devices.find((d) => d.id === prefixed);
      if (byId) setDevice(byId as DeviceDetail);
    }
  }, [hostId, devices]);

  // Fetch initial data and WebSocket
  useEffect(() => {
    if (!hostId) return;
    fetchDeviceData();

    const channel = pusherClient.subscribe("monitoring");
    channel.bind("device-updates", (data: any[]) => {
      if (data?.length) {
        const updated = data.find((d: any) => d.zabbixHostId === hostId);
        if (updated) {
          if (
            updated.cpu !== undefined &&
            updated.memory !== undefined &&
            !isNaN(updated.cpu) &&
            !isNaN(updated.memory)
          ) {
            updateDeviceData(updated);
            setLastUpdate(new Date());
            resetFallbackTimer();
          }
        }
      }
    });
    setIsConnected(true);
    resetFallbackTimer();

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe("monitoring");
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [hostId]);

  const resetFallbackTimer = () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      fetchLatestData();
    }, 10000);
  };

  // Fetch only latest values (for fallback)
  const fetchLatestData = async () => {
    if (!hostId) return;
    try {
      const res = await fetch(`/api/zabbix?action=items&hostId=${hostId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const cpuItem = findItemByKey(data.data, [
          "system.cpu.util",
          "cpu.utilization",
        ]);
        const memItem = findItemByKey(data.data, [
          "vm.memory.util",
          "memory.utilization",
        ]);
        if (cpuItem?.lastvalue && memItem?.lastvalue) {
          const cpuVal = Math.round(parseFloat(cpuItem.lastvalue));
          const memVal = Math.round(parseFloat(memItem.lastvalue));
          if (!isNaN(cpuVal) && !isNaN(memVal)) {
            updateDeviceData({
              cpu: cpuVal,
              memory: memVal,
              timestamp: new Date().toISOString(),
            });
            setLastUpdate(new Date());
          }
        }
      }
    } catch (err) {
      console.error("Fallback fetch failed:", err);
    } finally {
      resetFallbackTimer();
    }
  };

  const findItemByKey = (items: any[], keys: string[]) => {
    for (const key of keys) {
      const found = items.find(
        (item: any) => item.key_ === key || item.key_.includes(key)
      );
      if (found) return found;
    }
    return null;
  };

  // Full initial fetch (items + history)
  const fetchDeviceData = async () => {
    if (!hostId) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/zabbix?action=items&hostId=${hostId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
        const cpuItem = findItemByKey(data.data, [
          "system.cpu.util",
          "cpu.utilization",
        ]);
        const memItem = findItemByKey(data.data, [
          "vm.memory.util",
          "memory.utilization",
        ]);

        // Update device stats
        let updatedDevice = deviceRef.current;
        if (updatedDevice) {
          if (cpuItem?.lastvalue) {
            updatedDevice.cpu = Math.round(parseFloat(cpuItem.lastvalue));
            updatedDevice.cpuUnits = cpuItem.units || "%";
          }
          if (memItem?.lastvalue) {
            updatedDevice.memory = Math.round(parseFloat(memItem.lastvalue));
            updatedDevice.memoryUnits = memItem.units || "%";
          }
          setDevice({ ...updatedDevice });
        }

        // Fetch recent history (20 points) and filter out zero-only points
        await fetchRecentHistory(cpuItem, memItem, 20);
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError("Failed to load device data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchRecentHistory = async (cpuItem?: any, memItem?: any, limit = 20) => {
    try {
      const historyData: HistoryItem[] = [];

      if (cpuItem) {
        const cpuRes = await fetch(
          `/api/zabbix?action=history&itemId=${cpuItem.itemid}&limit=${limit}`
        );
        const cpuData = await cpuRes.json();
        if (cpuData.success && cpuData.data) {
          cpuData.data.forEach((item: any) => {
            const ts = new Date(Number(item.clock) * 1000).toISOString();
            historyData.push({
              timestamp: ts,
              cpu: Math.round(parseFloat(item.value)),
              memory: 0,
            });
          });
        }
      }

      if (memItem) {
        const memRes = await fetch(
          `/api/zabbix?action=history&itemId=${memItem.itemid}&limit=${limit}`
        );
        const memData = await memRes.json();
        if (memData.success && memData.data) {
          memData.data.forEach((item: any) => {
            const ts = new Date(Number(item.clock) * 1000).toISOString();
            const existing = historyData.find((h) => h.timestamp === ts);
            if (existing) {
              existing.memory = Math.round(parseFloat(item.value));
            } else {
              historyData.push({
                timestamp: ts,
                cpu: 0,
                memory: Math.round(parseFloat(item.value)),
              });
            }
          });
        }
      }

      // Sort by time
      historyData.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Filter out points where both cpu and memory are 0
      const filtered = historyData.filter((p) => {
        const cpuValid = !isNaN(p.cpu) && p.cpu > 0;
        const memValid = !isNaN(p.memory) && p.memory > 0;
        return cpuValid || memValid;
      });

      const trimmed = filtered.slice(-limit);
      setHistory(trimmed);
      historyRef.current = trimmed;
    } catch (err) {
      // ignore
    }
  };

  // Update from WebSocket or fallback (with spike protection)
  const updateDeviceData = (updatedDevice: any) => {
    if (!deviceRef.current) return;
    const newDevice = { ...deviceRef.current };
    let newCpu = newDevice.cpu;
    let newMem = newDevice.memory;

    if (typeof updatedDevice.cpu === "number" && !isNaN(updatedDevice.cpu)) {
      newCpu = updatedDevice.cpu;
    }
    if (typeof updatedDevice.memory === "number" && !isNaN(updatedDevice.memory)) {
      newMem = updatedDevice.memory;
    }

    // Spike protection
    if (newCpu === 0 && newDevice.cpu > 0) {
      newCpu = newDevice.cpu;
    }
    if (newMem === 0 && newDevice.memory > 0) {
      newMem = newDevice.memory;
    }

    newDevice.cpu = newCpu;
    newDevice.memory = newMem;
    if (updatedDevice.status) newDevice.status = updatedDevice.status;
    if (updatedDevice.trafficIn !== undefined)
      newDevice.trafficIn = updatedDevice.trafficIn;
    if (updatedDevice.trafficOut !== undefined)
      newDevice.trafficOut = updatedDevice.trafficOut;
    if (updatedDevice.timestamp) newDevice.timestamp = updatedDevice.timestamp;
    else newDevice.timestamp = new Date().toISOString();
    setDevice(newDevice);

    // Add new point
    if (newCpu > 0 || newMem > 0) {
      const now = new Date();
      let ts = now.toISOString();
      const last = historyRef.current[historyRef.current.length - 1];
      if (last && last.timestamp === ts) {
        now.setMilliseconds(now.getMilliseconds() + 1);
        ts = now.toISOString();
      }
      const newPoint: HistoryItem = { timestamp: ts, cpu: newCpu, memory: newMem };
      setHistory((prev) => {
        const updated = [...prev, newPoint];
        const trimmed = updated.slice(-50);
        historyRef.current = trimmed;
        return trimmed;
      });
    }
  };

  // ---- Ping handler ----
  const handlePing = async () => {
    if (!device) return;
    setPingModalOpen(true);
    setPingLoading(true);
    setPingResult("");
    setPingError(null);
    setPingCopied(false);

    try {
      const url = `/api/ping?host=${encodeURIComponent(device.ip)}&hostId=${encodeURIComponent(device.zabbixHostId || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setPingResult(data.output || "No output");
      } else {
        setPingError(data.error || "Ping failed");
        setPingResult(data.output || "");
      }
    } catch (err: any) {
      setPingError(err.message || "Network error");
    } finally {
      setPingLoading(false);
    }
  };

  const copyPingResult = async () => {
    const text = pingResult || pingError || "";
    await navigator.clipboard.writeText(text);
    setPingCopied(true);
    setTimeout(() => setPingCopied(false), 2000);
  };

  // ---- Format helpers ----
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
      <Badge
        className={isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
      >
        {isUp ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {isUp ? "Online" : "Offline"}
      </Badge>
    );
  };

  const getDeviceIcon = () => {
    if (!device) return <Box className="h-8 w-8" />;
    switch (device.type) {
      case "router":
        return <Router className="h-8 w-8" />;
      case "switch":
        return <Server className="h-8 w-8" />;
      case "firewall":
        return <Shield className="h-8 w-8" />;
      case "database":
        return <Database className="h-8 w-8" />;
      case "storage":
        return <HardDrive className="h-8 w-8" />;
      default:
        return <Box className="h-8 w-8" />;
    }
  };

  const getMetricStatus = (value: number, type: "cpu" | "memory") => {
    const threshold = type === "cpu" ? 80 : 85;
    const warning = type === "cpu" ? 60 : 70;
    if (value > threshold) return "critical";
    if (value > warning) return "warning";
    return "normal";
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-500">Error Loading Device</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={() => router.push("/zabbix")} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Device not found</p>
          <Button onClick={() => router.push("/zabbix")} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    );
  }

  const statusColor = device.status === "up" ? "text-green-500" : "text-red-500";
  const statusBadgeColor = device.status === "up" ? "bg-green-500" : "bg-red-500";

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
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
                <span>•</span>
                <Badge className="text-xs bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                  <Zap className="h-2 w-2" /> Live
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePing}
            className="flex items-center gap-1"
          >
            <Terminal className="h-4 w-4" />
            Ping
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeviceData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <span className="text-xs text-muted-foreground">
            {lastUpdate ? `Updated: ${lastUpdate.toLocaleTimeString()}` : ""}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p
                  className={`text-2xl font-bold ${
                    getMetricStatus(device.cpu, "cpu") === "critical"
                      ? "text-red-500"
                      : getMetricStatus(device.cpu, "cpu") === "warning"
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
                >
                  {device.cpu}
                  {device.cpuUnits || "%"}
                </p>
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
                <p
                  className={`text-2xl font-bold ${
                    getMetricStatus(device.memory, "memory") === "critical"
                      ? "text-red-500"
                      : getMetricStatus(device.memory, "memory") === "warning"
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
                >
                  {device.memory}
                  {device.memoryUnits || "%"}
                </p>
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

      {/* Tabs */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b bg-muted/50">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-background text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity className="inline h-4 w-4 mr-2" /> Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "metrics"
                ? "bg-background text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("metrics")}
          >
            <Gauge className="inline h-4 w-4 mr-2" /> Metrics
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Real‑time updates via WebSocket{" "}
              {isConnected ? "✅ Connected" : "⏳ Connecting..."}
            </div>

            {/* Combined Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" /> CPU & Memory Usage (Real‑time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient
                            id="cpuGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="memoryGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={formatTime}
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          labelFormatter={(ts) =>
                            new Date(ts as string).toLocaleString()
                          }
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="cpu"
                          stroke="#3b82f6"
                          fill="url(#cpuGradient)"
                          strokeWidth={2}
                          dot={false}
                          name="CPU"
                        />
                        <Area
                          type="monotone"
                          dataKey="memory"
                          stroke="#10b981"
                          fill="url(#memoryGradient)"
                          strokeWidth={2}
                          dot={false}
                          name="Memory"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p>No historical data available</p>
                      <p className="text-xs">Data will appear once received</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CPU Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
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
                        labelFormatter={(ts) =>
                          new Date(ts as string).toLocaleString()
                        }
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
              </CardContent>
            </Card>

            {/* Memory Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" /> Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
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
                        labelFormatter={(ts) =>
                          new Date(ts as string).toLocaleString()
                        }
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
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-3xl font-bold ${
                        getMetricStatus(device.cpu, "cpu") === "critical"
                          ? "text-red-500"
                          : getMetricStatus(device.cpu, "cpu") === "warning"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {device.cpu}%
                    </span>
                    <Cpu className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        device.cpu > 80
                          ? "bg-red-500"
                          : device.cpu > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${device.cpu}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {device.cpu > 80
                      ? "⚠️ High"
                      : device.cpu > 60
                      ? "⚡ Moderate"
                      : "✅ Normal"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Memory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-3xl font-bold ${
                        getMetricStatus(device.memory, "memory") === "critical"
                          ? "text-red-500"
                          : getMetricStatus(device.memory, "memory") === "warning"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {device.memory}%
                    </span>
                    <MemoryStick className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        device.memory > 85
                          ? "bg-red-500"
                          : device.memory > 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${device.memory}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {device.memory > 85
                      ? "⚠️ High"
                      : device.memory > 70
                      ? "⚡ Moderate"
                      : "✅ Normal"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${statusBadgeColor}`}
                    />
                    <span className="text-lg font-medium">
                      {device.status === "up" ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(device.timestamp).toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live WebSocket {isConnected ? "connected" : "connecting"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Network Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Inbound</p>
                    <p className="text-2xl font-bold">{device.trafficIn} Mbps</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outbound</p>
                    <p className="text-2xl font-bold">{device.trafficOut} Mbps</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Key</th>
                        <th className="text-right p-2 font-medium">Last Value</th>
                        <th className="text-right p-2 font-medium">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(0, 20).map((item) => (
                        <tr key={item.itemid} className="border-b hover:bg-muted/30">
                          <td className="p-2 text-xs">{item.name}</td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {item.key_}
                          </td>
                          <td className="p-2 text-right font-mono text-xs">
                            {item.lastvalue || "N/A"}
                          </td>
                          <td className="p-2 text-right text-xs text-muted-foreground">
                            {item.units || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Ping Modal */}
      {pingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setPingModalOpen(false)}
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Ping Result for {device.ip}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPingModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {pingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <span className="ml-2">Pinging...</span>
                </div>
              ) : (
                <pre className="bg-muted/30 p-4 rounded-md text-sm font-mono whitespace-pre-wrap break-words max-h-60 overflow-auto">
                  {pingResult || pingError || "No output"}
                </pre>
              )}
              {pingError && !pingLoading && (
                <p className="text-red-500 text-sm mt-2">Error: {pingError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={copyPingResult}
                disabled={pingLoading || (!pingResult && !pingError)}
                className="flex items-center gap-1"
              >
                {pingCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {pingCopied ? "Copied" : "Copy"}
              </Button>
              <Button
                size="sm"
                onClick={() => setPingModalOpen(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}