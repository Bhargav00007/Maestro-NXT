"use client";

import { useEffect, useState, useCallback } from "react";
import { useDeviceStore } from "@/lib/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, BellOff, AlertCircle, AlertTriangle } from "lucide-react";

interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string; 
  status: string;   
  value: string;    
  hosts?: Array<{ hostid: string; host: string }>;
}

const priorityLevels = {
  "0": { label: "Not classified", color: "bg-gray-500" },
  "1": { label: "Information", color: "bg-blue-500" },
  "2": { label: "Warning", color: "bg-yellow-500" },
  "3": { label: "Average", color: "bg-orange-500" },
  "4": { label: "High", color: "bg-red-500" },
  "5": { label: "Disaster", color: "bg-red-700" },
};

export default function AlertsPanel() {
  const devices = useDeviceStore((state) => state.devices);
  const [localAlerts, setLocalAlerts] = useState<string[]>([]);
  const [zabbixProblems, setZabbixProblems] = useState<ZabbixTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZabbixProblems = useCallback(async () => {
    try {
      const res = await fetch("/api/zabbix?action=triggers");
      const data = await res.json();
      if (data.success && data.data) {
        const problems = data.data.filter((t: ZabbixTrigger) => t.value === "1");
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

  const generateLocalAlerts = useCallback(() => {
    const newAlerts: string[] = [];
    devices.forEach((d) => {
      if (d.status === "down") {
        newAlerts.push(`${d.name} is DOWN`);
      }
      if (d.cpu > 80) {
        newAlerts.push(`${d.name} CPU high: ${d.cpu}%`);
      }
      if (d.memory > 85) {
        newAlerts.push(`${d.name} Memory high: ${d.memory}%`);
      }
    });
    setLocalAlerts(newAlerts);
  }, [devices]);

  useEffect(() => {
    fetchZabbixProblems();
    generateLocalAlerts();

    const interval = setInterval(() => {
      fetchZabbixProblems();
      generateLocalAlerts();
    }, 15000); 

    return () => clearInterval(interval);
  }, [fetchZabbixProblems, generateLocalAlerts]);

  useEffect(() => {
    if (devices.length > 0) {
      fetchZabbixProblems();
      generateLocalAlerts();
    }
  }, [devices, fetchZabbixProblems, generateLocalAlerts]);

  const allAlerts = [
    ...zabbixProblems.map((trigger) => ({
      id: trigger.triggerid,
      message: `${trigger.hosts?.[0]?.host || "Host"}: ${trigger.description}`,
      type: "zabbix",
      priority: parseInt(trigger.priority, 10) || 0,
    })),
    ...localAlerts.map((msg, idx) => ({
      id: `local-${idx}`,
      message: msg,
      type: "local",
      priority: 2, 
    })),
  ];

  allAlerts.sort((a, b) => {
    if (a.type === "zabbix" && a.priority >= 4) return -1;
    if (b.type === "zabbix" && b.priority >= 4) return 1;
    if (a.type === "local" && b.type === "zabbix") return 1;
    if (b.type === "local" && a.type === "zabbix") return -1;
    return 0;
  });

  const isConnected = devices.length > 0;

  const getAlertVariant = (alert: typeof allAlerts[0]) => {
    if (alert.type === "zabbix") {
      if (alert.priority >= 4) return "destructive";
      if (alert.priority >= 2) return "warning";
      return "default";
    }
    return "warning";
  };

  const getAlertIcon = (alert: typeof allAlerts[0]) => {
    if (alert.type === "zabbix" && alert.priority >= 4) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
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
          <span className="text-[10px] text-muted-foreground sm:text-xs">
            {allAlerts.length} Active
          </span>
          <a href="/alerts" className="text-[10px] text-muted-foreground hover:text-foreground sm:text-xs">
            View All
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
        {allAlerts.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {allAlerts.map((alert) => {
              const variant = getAlertVariant(alert);
              const isRed = variant === "destructive";
              const isYellow = variant === "warning";
              return (
                <Alert
                  key={alert.id}
                  variant={isRed ? "destructive" : "default"}
                  className={`text-[10px] sm:text-xs border-l-4 ${
                    isRed
                      ? "border-l-red-500 bg-red-50 dark:bg-red-950/20"
                      : isYellow
                      ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                      : "border-l-blue-500"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert)}
                    <div>
                      <AlertTitle className="text-[10px] font-semibold sm:text-xs">
                        {alert.type === "zabbix" ? "Zabbix Problem" : "Threshold Alert"}
                        {alert.type === "zabbix" && (
                          <span className="ml-2 text-[8px] font-normal text-muted-foreground sm:text-[10px]">
                            (Priority {alert.priority})
                          </span>
                        )}
                      </AlertTitle>
                      <AlertDescription className="text-[10px] sm:text-xs">
                        {alert.message}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
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