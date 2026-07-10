"use client";

import { useEffect, useState, useCallback } from "react";
import { useDeviceStore } from "@/lib/store";
import { Bell, BellOff, AlertCircle, AlertTriangle } from "lucide-react";

interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string;
  status: string;
  value: string;
  lastchange: string;
  hosts?: Array<{ hostid: string; host: string; name?: string }>;
}

export default function AlertsPanel() {
  const devices = useDeviceStore((state) => state.devices);
  const [zabbixProblems, setZabbixProblems] = useState<ZabbixTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZabbixProblems = useCallback(async () => {
    try {
      const res = await fetch("/api/zabbix?action=problems");
      const data = await res.json();
      if (data.success && data.data) {
        const problems = data.data.filter((t: ZabbixTrigger) => t.value === "1");
        problems.sort((a: { lastchange: string }, b: { lastchange: string }) => parseInt(b.lastchange) - parseInt(a.lastchange));
        setZabbixProblems(problems);
      } else {
        setError("Failed to fetch Zabbix problems");
      }
    } catch (err) {
      console.error("Error fetching Zabbix problems:", err);
      setError("Could not load Zabbix problems");
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocalAlerts = useCallback(() => {
    const alerts: Array<{ message: string; priority: number }> = [];
    devices.forEach((d) => {
      if (d.status === "down") {
        alerts.push({
          message: `${d.name} is DOWN`,
          priority: 1, 
        });
      }
      if (d.cpu > 80) {
        alerts.push({
          message: `${d.name} CPU high: ${d.cpu}%`,
          priority: 2, 
        });
      }
      if (d.memory > 85) {
        alerts.push({
          message: `${d.name} Memory high: ${d.memory}%`,
          priority: 2,
        });
      }
    });
    return alerts;
  }, [devices]);

  useEffect(() => {
    fetchZabbixProblems();
  }, [fetchZabbixProblems]);

  useEffect(() => {
    if (devices.length > 0) {
      fetchZabbixProblems();
    }
  }, [devices, fetchZabbixProblems]);

  const getRelativeTime = (seconds: string | number): string => {
    const now = Math.floor(Date.now() / 1000);
    const then = typeof seconds === "string" ? parseInt(seconds, 10) : seconds;
    const diff = now - then;
    if (diff < 0) return "just now";
    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${diff}s ago`;
  };

  const allAlerts = [
    ...zabbixProblems.map((trigger) => ({
      id: trigger.triggerid,
      message: `${trigger.hosts?.[0]?.name || trigger.hosts?.[0]?.host || "Unknown"}: ${trigger.description}`,
      type: "zabbix",
      priority: parseInt(trigger.priority, 10) || 0,
      lastchange: trigger.lastchange,
    })),
    ...getLocalAlerts().map((alert, idx) => ({
      id: `local-${idx}`,
      message: alert.message,
      type: "local",
      priority: alert.priority,
      lastchange: Math.floor(Date.now() / 1000).toString(),
    })),
  ];

  allAlerts.sort((a, b) => parseInt(b.lastchange) - parseInt(a.lastchange));

  const isConnected = devices.length > 0;

  const getAlertSeverity = (alert: typeof allAlerts[0]) => {
    if (alert.type === "zabbix") {
      if (alert.priority >= 4) return "critical";
      if (alert.priority >= 2) return "warning";
      return "info";
    }
    if (alert.priority >= 4) return "warning";
    return "critical";
  };

  const getAlertIcon = (alert: typeof allAlerts[0]) => {
    const sev = getAlertSeverity(alert);
    if (sev === "critical") return <AlertCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const renderMessage = (message: string) => {
    const colonIndex = message.indexOf(":");
    if (colonIndex === -1) {
      return <span className="text-xs sm:text-sm">{message}</span>;
    }
    const host = message.substring(0, colonIndex).trim();
    const rest = message.substring(colonIndex + 1).trim();
    return (
      <div className="flex flex-col">
        <strong className="text-xs sm:text-sm">{host}</strong>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{rest}</span>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex-shrink-0 border-b px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allAlerts.length > 0 ? (
              <Bell className="h-3 w-3 text-destructive sm:h-4 sm:w-4" />
            ) : (
              <BellOff className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
            )}
            <h3 className="text-xs font-semibold sm:text-sm">Alerts</h3>
            {isConnected && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500 sm:ml-2" />
            )}
            {loading && (
              <span className="ml-2 text-[10px] text-muted-foreground animate-pulse">loading...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              {allAlerts.length} Active
            </span>
            <a href="/alerts" className="text-[10px] text-muted-foreground hover:text-foreground sm:text-xs">
              View All
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
        {allAlerts.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {allAlerts.map((alert) => {
              const severity = getAlertSeverity(alert);
              const isCritical = severity === "critical";
              const isWarning = severity === "warning";

              let bgClass = "bg-muted/30";
              if (isCritical) bgClass = "bg-red-50 dark:bg-red-950/20";
              else if (isWarning) bgClass = "bg-yellow-50 dark:bg-yellow-950/20";
              else bgClass = "bg-blue-50 dark:bg-blue-950/20";

              let borderClass = "border-l-blue-500";
              if (isCritical) borderClass = "border-l-red-500";
              else if (isWarning) borderClass = "border-l-yellow-500";

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-3 text-[10px] sm:text-xs border-l-4 ${borderClass} ${bgClass}`}
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        {alert.type === "zabbix" && (
                          <span className="text-[8px] font-normal text-muted-foreground sm:text-[10px]">
                            Priority {alert.priority}
                          </span>
                        )}
                        <span className="text-[8px] text-muted-foreground sm:text-[10px]">
                          {getRelativeTime(alert.lastchange)}
                        </span>
                      </div>
                      <div className="mt-0.5">{renderMessage(alert.message)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-md bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground sm:px-4 sm:py-3 sm:text-sm">
              All devices healthy
              <div className="mt-0.5 text-[10px] text-muted-foreground/60 sm:mt-1 sm:text-xs">
                No active alerts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}