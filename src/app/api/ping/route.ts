// app/api/ping/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

async function fetchZabbixItem(hostId: string, itemKey: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/zabbix?action=items&hostId=${hostId}`
    );
    const data = await res.json();
    if (data.success && data.data) {
      const item = data.data.find((i: any) => i.key_ === itemKey);
      return item?.lastvalue;
    }
    return null;
  } catch {
    return null;
  }
}

function generatePingOutput(host: string, ip: string, reachable: boolean, latencyMs: number): string {
  const lines: string[] = [];
  lines.push(`Pinging ${ip} with 32 bytes of data:`);
  if (reachable) {
    const baseLatency = Math.round(latencyMs);
    for (let i = 1; i <= 4; i++) {
      const variation = Math.floor(Math.random() * 3) - 1;
      const time = Math.max(1, baseLatency + variation);
      lines.push(`Reply from ${ip}: bytes=32 time=${time}ms TTL=64`);
    }
    lines.push("");
    lines.push(`Ping statistics for ${ip}:`);
    lines.push(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
    lines.push("Approximate round trip times in milli-seconds:");
    const min = baseLatency;
    const max = baseLatency + 1;
    const avg = baseLatency;
    lines.push(`    Minimum = ${min}ms, Maximum = ${max}ms, Average = ${avg}ms`);
  } else {
    // 4 timeouts
    for (let i = 0; i < 4; i++) {
      lines.push(`Request timed out.`);
    }
    lines.push("");
    lines.push(`Ping statistics for ${ip}:`);
    lines.push(`    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),`);
  }
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const host = searchParams.get("host");
  const hostId = searchParams.get("hostId");

  if (!host) {
    return NextResponse.json(
      { error: "Host parameter is required" },
      { status: 400 }
    );
  }

  if (hostId) {
    try {
      const [pingStatus, pingSec] = await Promise.all([
        fetchZabbixItem(hostId, "icmpping"),
        fetchZabbixItem(hostId, "icmppingsec"),
      ]);

      if (pingStatus !== null && pingStatus !== undefined) {
        const reachable = pingStatus === "1";
        const latencyMs = pingSec ? parseFloat(pingSec) * 1000 : 1;
        const output = generatePingOutput(host, host, reachable, latencyMs);
        return NextResponse.json({ output });
      }
    } catch (error) {
      console.warn("Zabbix ping fallback failed, using system ping", error);
    }
  }

  // Fallback to system ping
  try {
    const isWindows = process.platform === "win32";
    const count = isWindows ? "-n 4" : "-c 4";
    const timeout = isWindows ? "-w 3000" : "-W 2";
    const command = `ping ${count} ${timeout} ${host}`;
    const { stdout, stderr } = await execPromise(command);
    const output = stdout + (stderr || "");
    return NextResponse.json({ output });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Ping failed",
        output: error.stdout || "",
      },
      { status: 500 }
    );
  }
}