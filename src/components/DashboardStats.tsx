"use client";

import { useEffect, useState, useMemo } from "react";
import { useDeviceStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Wifi, WifiOff, Bell } from "lucide-react";
import CountUp from "@/components/ui/count";

interface ZabbixTrigger {
  triggerid: string;
  value: string;
}

export default function DashboardStats() {
  const devices = useDeviceStore((state) => state.devices);
  const [zabbixProblemCount, setZabbixProblemCount] = useState(0);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch("/api/zabbix?action=problems");
        const data = await res.json();
        if (data.success && data.data) {
          const problems = data.data.filter((t: ZabbixTrigger) => t.value === "1");
          setZabbixProblemCount(problems.length);
        }
      } catch (error) {
        console.error("Failed to fetch Zabbix problems:", error);
      }
    };

    fetchProblems();
    const interval = setInterval(fetchProblems, 15000);
    return () => clearInterval(interval);
  }, [devices]);

  // Compute local alerts (down, high CPU, high memory)
  const localAlertsCount = useMemo(() => {
    let count = 0;
    devices.forEach((d) => {
      if (d.status === "down") count++;
      if (d.cpu > 80) count++;
      if (d.memory > 85) count++;
    });
    return count;
  }, [devices]);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "up").length;
  const offlineDevices = devices.filter((d) => d.status === "down").length;
  const totalAlerts = zabbixProblemCount + localAlertsCount;

  const stats = [
    {
      title: "Total Devices",
      value: totalDevices,
      icon: Server,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Online Devices",
      value: onlineDevices,
      icon: Wifi,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Offline Devices",
      value: offlineDevices,
      icon: WifiOff,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
    {
      title: "Total Alerts",
      value: totalAlerts,
      icon: Bell,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <CountUp
                from={0}
                to={stat.value}
                separator=","
                direction="up"
                duration={1.5}
                delay={0.2}
                className="count-up-text"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}