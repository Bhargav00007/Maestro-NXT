import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";

const devices = [
  // Singapore Region
  { id: "sg-rtr-01", name: "SG Core Router", ip: "10.1.0.1", type: "router", region: "singapore" },
  { id: "sg-sw-01", name: "SG Distribution Switch", ip: "10.1.0.2", type: "switch", region: "singapore" },
  { id: "sg-sw-02", name: "SG Access Switch", ip: "10.1.0.3", type: "switch", region: "singapore" },
  { id: "sg-rtr-02", name: "SG Edge Router", ip: "10.1.0.4", type: "router", region: "singapore" },
  { id: "sg-fw-01", name: "SG Firewall", ip: "10.1.0.5", type: "firewall", region: "singapore" },
  { id: "sg-lb-01", name: "SG Load Balancer", ip: "10.1.0.6", type: "loadbalancer", region: "singapore" },

  // Data Center - Ashburn
  { id: "ash-rtr-01", name: "Ashburn Core Router", ip: "10.2.0.1", type: "router", region: "ashburn" },
  { id: "ash-sw-01", name: "Ashburn Distribution Switch", ip: "10.2.0.2", type: "switch", region: "ashburn" },
  { id: "ash-sw-02", name: "Ashburn Access Switch", ip: "10.2.0.3", type: "switch", region: "ashburn" },
  { id: "ash-rtr-02", name: "Ashburn Edge Router", ip: "10.2.0.4", type: "router", region: "ashburn" },
  { id: "ash-fw-01", name: "Ashburn Firewall", ip: "10.2.0.5", type: "firewall", region: "ashburn" },
  { id: "ash-st-01", name: "Ashburn Storage", ip: "10.2.0.6", type: "storage", region: "ashburn" },

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

  // Keep original devices for backward compatibility
  { id: "rtr-01", name: "Core Router", ip: "10.0.0.1", type: "router", region: "default" },
  { id: "sw-01", name: "Distribution Switch", ip: "10.0.0.2", type: "switch", region: "default" },
  { id: "sw-02", name: "Access Switch", ip: "10.0.0.3", type: "switch", region: "default" },
  { id: "rtr-02", name: "Edge Router", ip: "10.0.0.4", type: "router", region: "default" },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDeviceData() {
  return devices.map((device) => ({
    ...device,
    cpu: randomInt(10, 85),
    memory: randomInt(20, 90),
    status: Math.random() > 0.15 ? "up" : "down",
    trafficIn: randomInt(100, 5000),
    trafficOut: randomInt(50, 3000),
    timestamp: new Date().toISOString(),
  }));
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