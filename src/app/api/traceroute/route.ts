// app/api/traceroute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Helper: fetch item value from Zabbix
async function fetchZabbixTraceroute(hostId: string, targetIp: string) {
  try {
    // Build the expected item key – you can adjust this to match your Zabbix item key pattern
    const itemKey = `custom.traceroute[${targetIp}]`;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/zabbix?action=items&hostId=${hostId}`
    );
    const data = await res.json();
    if (data.success && data.data) {
      const item = data.data.find((i: any) => i.key_ === itemKey);
      if (item && item.lastvalue) {
        return item.lastvalue;
      }
    }
    return null;
  } catch (error) {
    console.warn("Failed to fetch Zabbix traceroute item:", error);
    return null;
  }
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

  // 1. Try to get traceroute from Zabbix (if hostId is provided)
  if (hostId) {
    try {
      const zabbixOutput = await fetchZabbixTraceroute(hostId, host);
      if (zabbixOutput) {
        return NextResponse.json({ output: zabbixOutput });
      }
    } catch (error) {
      console.warn("Zabbix traceroute fetch failed, falling back to system traceroute", error);
    }
  }

  // 2. Fallback to system traceroute (from the Next.js server)
  try {
    const isWindows = process.platform === "win32";
    const command = isWindows
      ? `tracert -d -h 30 ${host}`
      : `traceroute -n -m 30 ${host}`;
    const { stdout, stderr } = await execPromise(command, { timeout: 60000 });
    const output = stdout + (stderr || "");
    // Even if stderr has warnings, we return success
    return NextResponse.json({ output });
  } catch (error: any) {
    const output = error.stdout || "";
    return NextResponse.json(
      {
        output: output || `Error: ${error.message}`,
        warning: "Traceroute completed with errors (some hops may have timed out).",
      },
      { status: 200 }
    );
  }
}