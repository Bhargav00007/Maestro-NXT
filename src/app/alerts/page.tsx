"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDeviceStore } from "@/lib/store";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Types
interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string;
  status: string;
  value: string;
  lastchange: string;
  hosts?: Array<{ hostid: string; host: string; name?: string }>;
}

interface ZabbixEvent {
  eventid: string;
  source: string;
  object: string;
  objectid: string;
  clock: string;
  value: string; // 0 = OK, 1 = PROBLEM
  acknowledged: string;
  hosts?: Array<{ hostid: string; host: string; name?: string }>;
  triggers?: Array<{
    triggerid: string;
    description: string;
    priority: string;
    status: string;
  }>;
}

interface LocalAlert {
  id: string;
  message: string;
  type: "local";
  priority: number;
  host?: string;
  timestamp: number; // for sorting
}

export default function AlertsPage() {
  const router = useRouter();
  const devices = useDeviceStore((state) => state.devices);
  const [activeAlerts, setActiveAlerts] = useState<(ZabbixTrigger | LocalAlert)[]>([]);
  const [historyEvents, setHistoryEvents] = useState<ZabbixEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active triggers (problems) from Zabbix
  const fetchActiveTriggers = useCallback(async () => {
    try {
      const res = await fetch("/api/zabbix?action=problems");
      const data = await res.json();
      if (data.success && data.data) {
        // Already filtered for problems, but ensure value=1
        const problems = data.data.filter((t: ZabbixTrigger) => t.value === "1");
        // Sort by lastchange descending (latest first)
        problems.sort((a: { lastchange: string; }, b: { lastchange: string; }) => parseInt(b.lastchange) - parseInt(a.lastchange));
        return problems;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch triggers:", err);
      return [];
    }
  }, []);

  // Fetch historical events
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/zabbix?action=events&limit=200");
      const data = await res.json();
      if (data.success && data.data) {
        // Sort by clock descending (latest first)
        const events = data.data.sort((a: ZabbixEvent, b: ZabbixEvent) => parseInt(b.clock) - parseInt(a.clock));
        return events;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch events:", err);
      return [];
    }
  }, []);

  // Generate local alerts from store
  const generateLocalAlerts = useCallback((): LocalAlert[] => {
    const alerts: LocalAlert[] = [];
    const now = Date.now() / 1000;
    devices.forEach((d) => {
      if (d.status === "down") {
        alerts.push({
          id: `local-down-${d.id}`,
          message: `${d.name} is DOWN`,
          type: "local",
          priority: 4,
          host: d.name,
          timestamp: now,
        });
      }
      if (d.cpu > 80) {
        alerts.push({
          id: `local-cpu-${d.id}`,
          message: `${d.name} CPU high: ${d.cpu}%`,
          type: "local",
          priority: 2,
          host: d.name,
          timestamp: now,
        });
      }
      if (d.memory > 85) {
        alerts.push({
          id: `local-mem-${d.id}`,
          message: `${d.name} Memory high: ${d.memory}%`,
          type: "local",
          priority: 2,
          host: d.name,
          timestamp: now,
        });
      }
    });
    return alerts;
  }, [devices]);

  // Load all data
  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [triggers, events] = await Promise.all([
        fetchActiveTriggers(),
        fetchHistory(),
      ]);

      const local = generateLocalAlerts();

      // Combine: Zabbix problems (already sorted by latest) + local alerts
      const combined: (ZabbixTrigger | LocalAlert)[] = [
        ...triggers,
        ...local,
      ];

      // Sort by timestamp descending (latest first)
      combined.sort((a, b) => {
        const ta = 'lastchange' in a ? parseInt(a.lastchange) : (a as LocalAlert).timestamp;
        const tb = 'lastchange' in b ? parseInt(b.lastchange) : (b as LocalAlert).timestamp;
        return tb - ta;
      });

      setActiveAlerts(combined);
      setHistoryEvents(events);
      setError(null);
    } catch (err) {
      console.error("Error loading alerts data:", err);
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchActiveTriggers, fetchHistory, generateLocalAlerts]);

  // Initial load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when devices store updates (triggered by Pusher WebSocket)
  useEffect(() => {
    if (devices.length > 0) {
      loadData();
    }
  }, [devices, loadData]);

  // Helper: format timestamp
  const formatTime = (ts: string) => {
    return new Date(Number(ts) * 1000).toLocaleString();
  };

  // Helper: calculate duration from a start timestamp
  const getDuration = (startTs: string) => {
    const start = Number(startTs) * 1000;
    const now = Date.now();
    const diff = now - start;
    if (diff < 0) return "0s";
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Helper: priority label and color
  const getPriorityInfo = (priority: number | string) => {
    const p = typeof priority === 'string' ? parseInt(priority, 10) : priority;
    const labels = [
      { label: "Not classified", color: "bg-gray-500" },
      { label: "Information", color: "bg-blue-500" },
      { label: "Warning", color: "bg-yellow-500" },
      { label: "Average", color: "bg-orange-500" },
      { label: "High", color: "bg-red-500" },
      { label: "Disaster", color: "bg-red-700" },
    ];
    return labels[p] || labels[0];
  };

  const getAlertVariant = (alert: any) => {
    if ('type' in alert && alert.type === 'local') {
      if (alert.priority >= 4) return "destructive";
      return "warning";
    }
    const p = parseInt(alert.priority, 10);
    if (p >= 4) return "destructive";
    if (p >= 2) return "warning";
    return "default";
  };

  const getAlertIcon = (alert: any) => {
    const variant = getAlertVariant(alert);
    if (variant === "destructive") return <AlertCircle className="h-4 w-4" />;
    if (variant === "warning") return <AlertTriangle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Real‑time and historical alert monitoring
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Alert History
            {historyEvents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {historyEvents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {activeAlerts.length === 0 ? "No active alerts" : `${activeAlerts.length} active alert(s)`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>All systems healthy</p>
                  <p className="text-sm">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => {
                    const isLocal = 'type' in alert && alert.type === 'local';
                    const hostName = isLocal
                      ? (alert as LocalAlert).host || 'Unknown'
                      : (alert as ZabbixTrigger).hosts?.[0]?.name || (alert as ZabbixTrigger).hosts?.[0]?.host || 'Unknown';
                    const description = isLocal
                      ? (alert as LocalAlert).message
                      : (alert as ZabbixTrigger).description;
                    const priority = isLocal
                      ? (alert as LocalAlert).priority
                      : parseInt((alert as ZabbixTrigger).priority, 10);
                    const lastchange = isLocal
                      ? (alert as LocalAlert).timestamp.toString()
                      : (alert as ZabbixTrigger).lastchange;
                    const variant = getAlertVariant(alert);
                    const priorityInfo = isLocal
                      ? { label: priority >= 4 ? 'Critical' : 'Warning', color: priority >= 4 ? 'bg-red-500' : 'bg-yellow-500' }
                      : getPriorityInfo(priority);

                    return (
                      <div
                        key={isLocal ? (alert as LocalAlert).id : (alert as ZabbixTrigger).triggerid}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border-l-4",
                          variant === "destructive"
                            ? "border-l-red-500 bg-red-50 dark:bg-red-950/20"
                            : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert)}
                          <div>
                            <p className="font-medium text-sm">{description}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{hostName}</span>
                              <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                              <span className={cn("px-1.5 py-0.5 rounded-full text-white text-[10px]", priorityInfo.color)}>
                                {priorityInfo.label}
                              </span>
                              {isLocal ? (
                                <span className="text-yellow-600">Local threshold</span>
                              ) : (
                                <>
                                  <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Duration: {lastchange ? getDuration(lastchange) : 'N/A'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center gap-2">
                          {isLocal ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">Local</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-300">Zabbix</Badge>
                          )}
                          <Badge variant={variant === "destructive" ? "destructive" : "default"}>
                            {variant === "destructive" ? "Critical" : "Warning"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {historyEvents.length === 0 ? "No historical alerts" : `Last ${historyEvents.length} events`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No historical alerts found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2 font-medium">Time</th>
                        <th className="text-left p-2 font-medium">Host</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Priority</th>
                        <th className="text-left p-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyEvents.map((event) => {
                        const trigger = event.triggers?.[0];
                        const host = event.hosts?.[0]?.name || event.hosts?.[0]?.host || 'Unknown';
                        const description = trigger?.description || 'Unknown trigger';
                        const priority = trigger ? parseInt(trigger.priority, 10) : 0;
                        const priorityInfo = getPriorityInfo(priority);
                        const isProblem = event.value === '1';
                        return (
                          <tr key={event.eventid} className="border-b hover:bg-muted/30">
                            <td className="p-2 text-xs">{formatTime(event.clock)}</td>
                            <td className="p-2">{host}</td>
                            <td className="p-2">{description}</td>
                            <td className="p-2">
                              {isProblem ? (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <XCircle className="h-3 w-3" /> Problem
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" /> Resolved
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <span className={cn("px-1.5 py-0.5 rounded-full text-white text-[10px]", priorityInfo.color)}>
                                {priorityInfo.label}
                              </span>
                            </td>
                            <td className="p-2 text-xs">
                              {new Date(Number(event.clock) * 1000).toLocaleTimeString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}