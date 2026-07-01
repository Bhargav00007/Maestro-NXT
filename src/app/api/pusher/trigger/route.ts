import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";

const devices = [
  // Data Center - Culpepper
  { id: "cul-rtr-01", name: "Culpepper Core Router", ip: "10.2.0.1", type: "router", region: "culpepper" },
  { id: "cul-sw-01", name: "Culpepper Distribution Switch", ip: "10.2.0.2", type: "switch", region: "culpepper" },
  { id: "cul-sw-02", name: "Culpepper Access Switch", ip: "10.2.0.3", type: "switch", region: "culpepper" },
  { id: "cul-rtr-02", name: "Culpepper Edge Router", ip: "10.2.0.4", type: "router", region: "culpepper" },
  { id: "cul-fw-01", name: "Culpepper Firewall", ip: "10.2.0.5", type: "firewall", region: "culpepper" },
  { id: "cul-st-01", name: "Culpepper Storage", ip: "10.2.0.6", type: "storage", region: "culpepper" },

  // Data Center - Plainsboro
  { id: "pln-rtr-01", name: "Plainsboro Core Router", ip: "10.3.0.1", type: "router", region: "plainsboro" },
  { id: "pln-sw-01", name: "Plainsboro Distribution Switch", ip: "10.3.0.2", type: "switch", region: "plainsboro" },
  { id: "pln-sw-02", name: "Plainsboro Access Switch", ip: "10.3.0.3", type: "switch", region: "plainsboro" },
  { id: "pln-rtr-02", name: "Plainsboro Edge Router", ip: "10.3.0.4", type: "router", region: "plainsboro" },
  { id: "pln-fw-01", name: "Plainsboro Firewall", ip: "10.3.0.5", type: "firewall", region: "plainsboro" },
  { id: "pln-db-01", name: "Plainsboro Database", ip: "10.3.0.6", type: "database", region: "plainsboro" },

  // Hyderabad Region
  { id: "hyd-rtr-01", name: "HYD Core Router", ip: "10.4.0.1", type: "router", region: "hyderabad" },
  { id: "hyd-sw-01", name: "HYD Distribution Switch", ip: "10.4.0.2", type: "switch", region: "hyderabad" },
  { id: "hyd-sw-02", name: "HYD Access Switch", ip: "10.4.0.3", type: "switch", region: "hyderabad" },
  { id: "hyd-rtr-02", name: "HYD Edge Router", ip: "10.4.0.4", type: "router", region: "hyderabad" },
  { id: "hyd-fw-01", name: "HYD Firewall", ip: "10.4.0.5", type: "firewall", region: "hyderabad" },
  { id: "hyd-lb-01", name: "HYD Load Balancer", ip: "10.4.0.6", type: "loadbalancer", region: "hyderabad" },
  { id: "hyd-st-01", name: "HYD Storage", ip: "10.4.0.7", type: "storage", region: "hyderabad" },

  // Main default devices
  { id: "rtr-01", name: "Core Router", ip: "10.0.0.1", type: "router", region: "default" },
  { id: "sw-01", name: "Distribution Switch", ip: "10.0.0.2", type: "switch", region: "default" },
  { id: "sw-02", name: "Access Switch", ip: "10.0.0.3", type: "switch", region: "default" },
  { id: "rtr-02", name: "Edge Router", ip: "10.0.0.4", type: "router", region: "default" },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDeviceData() {
  return devices.map((device) => {
    // Determine status first
    const isUp = Math.random() > 0.15;
    
    return {
      ...device,
      // If device is down, set CPU and memory to 0
      cpu: isUp ? randomInt(10, 85) : 0,
      memory: isUp ? randomInt(20, 90) : 0,
      status: isUp ? "up" : "down",
      // Traffic also 0 when offline
      trafficIn: isUp ? randomInt(100, 5000) : 0,
      trafficOut: isUp ? randomInt(50, 3000) : 0,
      timestamp: new Date().toISOString(),
    };
  });
}

export async function GET() {
  try {
    const data = generateDeviceData();
    await pusherServer.trigger("monitoring", "device-updates", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger update" },
      { status: 500 }
    );
  }
}