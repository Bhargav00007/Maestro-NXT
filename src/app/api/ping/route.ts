
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
        const status = pingStatus === "1" ? "reachable" : "unreachable";
        const sec = pingSec ? parseFloat(pingSec).toFixed(6) : "0.000000";
        const output = `PING ${host} from Zabbix: 4 packets transmitted, ${status === "reachable" ? "4 received" : "0 received"}, 0% packet loss\nround-trip min/avg/max = ${sec}/${sec}/${sec} ms`;
        return NextResponse.json({ output });
      }
    } catch (error) {
      console.warn("Zabbix ping fallback failed, using system ping", error);
    }
  }


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