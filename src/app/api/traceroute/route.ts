import { NextRequest, NextResponse } from "next/server";

async function fetchZabbixTraceroute(hostId: string, targetIp: string) {
  try {
    const itemKey = `custom.traceroute[${targetIp}]`;

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/zabbix?action=items&hostId=${hostId}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (data.success && data.data) {
      const item = data.data.find((i: any) => i.key_ === itemKey);

      if (item?.lastvalue) {
        return item.lastvalue;
      }
    }

    return null;
  } catch (err) {
    console.warn("Failed to fetch traceroute from Zabbix:", err);
    return null;
  }
}

async function fetchTracerouteFromVM(host: string) {
  try {
    const vmUrl =
      process.env.TRACEROUTE_API_URL ||
      "http://172.24.192.57:5050";

    const res = await fetch(
      `${vmUrl}/traceroute?host=${encodeURIComponent(host)}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`VM returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Failed to contact VM:", err);
    throw err;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const host = searchParams.get("host");
  const hostId = searchParams.get("hostId");

  if (!host) {
    return NextResponse.json(
      {
        error: "Host parameter is required",
      },
      {
        status: 400,
      }
    );
  }

  /**
   * STEP 1
   * Try reading an existing traceroute item from Zabbix
   */
  if (hostId) {
    try {
      const zabbixOutput = await fetchZabbixTraceroute(hostId, host);

      if (zabbixOutput) {
        return NextResponse.json({
          source: "zabbix-item",
          output: zabbixOutput,
        });
      }
    } catch (err) {
      console.warn("Unable to fetch traceroute item from Zabbix:", err);
    }
  }

  /**
   * STEP 2
   * No Zabbix item exists.
   * Execute traceroute FROM THE UBUNTU VM.
   */
  try {
    const result = await fetchTracerouteFromVM(host);

    return NextResponse.json({
      source: "ubuntu-vm",
      output: result.output,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Unable to execute traceroute on Ubuntu VM.",
        details: err.message,
      },
      {
        status: 500,
      }
    );
  }
}