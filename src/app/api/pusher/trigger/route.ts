import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";

const devices = [
  { id: "rtr-01", name: "Core Router", ip: "10.0.0.1", type: "router" },
  { id: "sw-01", name: "Distribution Switch", ip: "10.0.0.2", type: "switch" },
  { id: "sw-02", name: "Access Switch", ip: "10.0.0.3", type: "switch" },
  { id: "rtr-02", name: "Edge Router", ip: "10.0.0.4", type: "router" },
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
    // Push to Pusher so all clients get it
    await pusherServer.trigger("monitoring", "device-updates", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger update" },
      { status: 500 },
    );
  }
}
