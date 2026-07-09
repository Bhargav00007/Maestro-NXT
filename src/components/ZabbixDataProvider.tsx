"use client";

import { useEffect } from "react";
import { useDeviceStore } from "@/lib/store";

const ZABBIX_URL = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
const API_URL = `${ZABBIX_URL}/api_jsonrpc.php`;
const USER = process.env.ZABBIX_USER || "Admin";
const PASSWORD = process.env.ZABBIX_PASSWORD || "zabbix";

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

function getRegionFromName(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("CUL")) return "culpepper";
  if (upper.includes("HYD")) return "hyderabad";
  if (upper.includes("PLB")) return "plainsboro";
  return "default";
}

// Helper: Zabbix JSON‑RPC request
async function zabbixRequest(method: string, params: any = {}, token?: string) {
  const body: any = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
  };
  if (token) body.auth = token;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json-rpc" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`${data.error.message} (Code: ${data.error.code})`);
  }
  return data.result;
}

export default function ZabbixDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setDevices = useDeviceStore((state) => state.setDevices);

  const fetchZabbixData = async () => {
    try {
      // 1. Login to get auth token
      const authToken = await zabbixRequest("user.login", {
        username: USER,
        password: PASSWORD,
      });

      // 2. Get hosts with items (including uptime/ICMP)
      const hosts = await zabbixRequest(
        "host.get",
        {
          output: ["hostid", "host", "name", "status", "available", "error"],
          selectInterfaces: ["ip", "dns", "port", "type"],
          selectItems: [
            "itemid",
            "name",
            "key_",
            "lastvalue",
            "units",
            "status",
            "description",
          ],
          selectTriggers: ["triggerid", "description", "priority", "status", "value"],
          filter: { status: 0 },
        },
        authToken
      );

      if (hosts && hosts.length > 0) {
        const devices = hosts.map((host: ZabbixHost) => {
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
          if (cpuItem?.lastvalue) {
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
          if (memItem?.lastvalue) {
            memory = Math.round(parseFloat(memItem.lastvalue));
            memoryUnits = memItem.units || "%";
          }

          // ---- ICMP Ping (primary) ----
          const pingItem = items.find(
            (item) => item.key_ === "icmpping" || item.key_.includes("icmpping")
          );

          // ---- Uptime (fallback) ----
          const uptimeItem = items.find(
            (item) =>
              item.key_ === "system.uptime" ||
              item.key_ === "agent.uptime" ||
              item.key_ === "system.net.uptime[sysUpTime.0]" ||
              item.key_.includes("uptime")
          );

          // ---- Agent availability ----
          const agentItem = items.find(
            (item) => item.key_ === "zabbix[host,agent,available]"
          );

          // ---- Determine status (default offline) ----
          let isUp = false;

          if (pingItem?.lastvalue !== undefined) {
            isUp = pingItem.lastvalue === "1";
            console.log(`📡 ${host.name}: icmpping = ${pingItem.lastvalue} → ${isUp ? "ONLINE" : "OFFLINE"}`);
          } else if (uptimeItem?.lastvalue !== undefined) {
            const uptime = parseFloat(uptimeItem.lastvalue);
            isUp = uptime > 0;
            console.log(`📡 ${host.name}: uptime = ${uptime} → ${isUp ? "ONLINE" : "OFFLINE"}`);
          } else if (host.available !== undefined && host.available !== null) {
            isUp = host.available === "0";
            console.log(`📡 ${host.name}: available = ${host.available} → ${isUp ? "ONLINE" : "OFFLINE"}`);
          } else if (agentItem?.lastvalue !== undefined) {
            isUp = agentItem.lastvalue === "1";
            console.log(`📡 ${host.name}: agent = ${agentItem.lastvalue} → ${isUp ? "ONLINE" : "OFFLINE"}`);
          } else {
            console.log(`📡 ${host.name}: no status data → OFFLINE (default)`);
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
          if (netInItem?.lastvalue) {
            trafficIn = Math.round(parseFloat(netInItem.lastvalue) / 1000000);
          }
          if (netOutItem?.lastvalue) {
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

          // ---- Region ----
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
            region: region,
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

        setDevices(devices);

        const upCount = devices.filter((d: { status: string }) => d.status === "up").length;
        const downCount = devices.filter((d: { status: string }) => d.status === "down").length;
        console.log(
          `✅ Loaded ${devices.length} devices (${upCount} UP, ${downCount} DOWN)`
        );
      } else {
        console.log("ℹ️ No hosts found in Zabbix");
      }
    } catch (error) {
      console.error("❌ Failed to fetch Zabbix data:", error);
    }
  };

  useEffect(() => {
    fetchZabbixData();
    const interval = setInterval(fetchZabbixData, 10000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}