"use client";

import { useEffect } from "react";
import { useDeviceStore } from "@/lib/store";

interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue?: string;
  units?: string;
  status?: string;
  description?: string;
}

interface ZabbixHost {
  hostid: string;
  host: string;
  name?: string;
  available?: string;
  status?: string;
  error?: string;
  items?: ZabbixItem[];
  interfaces?: Array<{
    ip: string;
    dns: string;
    port: string;
    type: string;
  }>;
}

// Helper: determine region from host name (case‑insensitive)
function getRegionFromName(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("CUL")) return "culpepper";
  if (upper.includes("HYD")) return "hyderabad";
  if (upper.includes("PLB")) return "plainsboro";
  return "default";
}

export default function ZabbixDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setDevices = useDeviceStore((state) => state.setDevices);

  const fetchZabbixData = async () => {
    try {

      const response = await fetch("/api/zabbix?action=hosts");
      const data = await response.json();

      if (data.success && data.data) {
        const devices = data.data.map((host: ZabbixHost) => {
          const items = host.items || [];

          // ---- CPU ----
          let cpu = 0;
          let cpuUnits = "%";
          const cpuItem = items.find(
            (item) =>
              item.key_ === "system.cpu.util" ||
              item.key_.includes("cpu.utilization") ||
              item.key_.includes("system.cpu.util")
          );
          if (cpuItem && cpuItem.lastvalue) {
            cpu = Math.round(parseFloat(cpuItem.lastvalue));
            cpuUnits = cpuItem.units || "%";
          }

          // ---- Memory ----
          let memory = 0;
          let memoryUnits = "%";
          const memItem = items.find(
            (item) =>
              item.key_ === "vm.memory.util" ||
              item.key_.includes("memory.utilization") ||
              item.key_.includes("vm.memory.util")
          );
          if (memItem && memItem.lastvalue) {
            memory = Math.round(parseFloat(memItem.lastvalue));
            memoryUnits = memItem.units || "%";
          }

          // ---- Host status ----
          let isUp = true;
          const pingItem = items.find(
            (item) => item.key_ === "icmpping" || item.key_.includes("icmpping")
          );

          if (host.available === "1") {
            isUp = false;
          } else if (host.available === "2") {
            if (pingItem && pingItem.lastvalue) {
              isUp = pingItem.lastvalue === "1";
            } else {
              isUp = cpu > 0 || memory > 0;
            }
          } else if (host.available === "0") {
            isUp = true;
          }

          // Check Zabbix agent availability
          const agentItem = items.find(
            (item) => item.key_ === "zabbix[host,agent,available]"
          );
          if (agentItem && agentItem.lastvalue === "0") {
            isUp = false;
          }


          // ---- Traffic (example) ----
          let trafficIn = 0;
          let trafficOut = 0;
          const netInItem = items.find(
            (item) => item.key_.includes("net.if.in") && item.key_.includes("ens160")
          );
          const netOutItem = items.find(
            (item) => item.key_.includes("net.if.out") && item.key_.includes("ens160")
          );
          if (netInItem && netInItem.lastvalue) {
            trafficIn = Math.round(parseFloat(netInItem.lastvalue) / 1000000);
          }
          if (netOutItem && netOutItem.lastvalue) {
            trafficOut = Math.round(parseFloat(netOutItem.lastvalue) / 1000000);
          }

          // ---- Device type ----
          let type = "server";
          const name = (host.name || host.host).toLowerCase();
          if (name.includes("router") || name.includes("rtr")) type = "router";
          else if (name.includes("switch") || name.includes("sw")) type = "switch";
          else if (name.includes("firewall") || name.includes("fw")) type = "firewall";
          else if (name.includes("load") || name.includes("lb")) type = "loadbalancer";
          else if (name.includes("storage") || name.includes("st")) type = "storage";
          else if (name.includes("database") || name.includes("db")) type = "database";
          else if (name.includes("mpls")) type = "router";

          // ---- Region from host name ----
          const region = getRegionFromName(host.name || host.host);

          // ---- IP ----
          let ip = host.host;
          if (host.interfaces && host.interfaces.length > 0) {
            ip = host.interfaces[0].ip || host.host;
          }

          return {
            id: `zabbix-${host.hostid}`,
            name: host.name || host.host,
            ip: ip,
            type: type,
            region: region,                     // 👈 assigned here
            cpu: isUp ? cpu : 0,
            memory: isUp ? memory : 0,
            status: isUp ? "up" : "down",
            trafficIn: isUp ? trafficIn : 0,
            trafficOut: isUp ? trafficOut : 0,
            timestamp: new Date().toISOString(),
            zabbixHostId: host.hostid,
            cpuUnits: cpuUnits,
            memoryUnits: memoryUnits,
          };
        });

        // Update the store
        setDevices(devices);

        const upCount = devices.filter((d: { status: string }) => d.status === "up").length;
        const downCount = devices.filter((d: { status: string }) => d.status === "down").length;
  

        devices.forEach((d: any) => {
          console.log(
          );
        });
      } else {
        console.error("Failed to fetch Zabbix data:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch Zabbix data:", error);
    }
  };

  useEffect(() => {
    fetchZabbixData();
    const interval = setInterval(fetchZabbixData, 10000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}