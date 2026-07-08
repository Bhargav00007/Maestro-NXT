import { NextRequest, NextResponse } from "next/server";

const ZABBIX_URL = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
const API_URL = `${ZABBIX_URL}/api_jsonrpc.php`;
const USER = process.env.ZABBIX_USER || "Admin";
const PASSWORD = process.env.ZABBIX_PASSWORD || "zabbix";

// ─── Zabbix API request helper ──────────────────────────────────────────────
async function zabbixRequest(method: string, params: any = {}, token?: string) {
  const body: any = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
  };
  if (token) body.auth = token;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json-rpc" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);
  return data.result;
}

// ─── Get authentication token ──────────────────────────────────────────────
async function getAuthToken() {
  try {
    return await zabbixRequest("user.login", {
      username: process.env.ZABBIX_USER || "Admin",
      password: process.env.ZABBIX_PASSWORD || "zabbix",
    });
  } catch (error) {
    console.error("Failed to get auth token:", error);
    throw error;
  }
}

// ─── Main GET handler ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "hosts";
    const hostId = searchParams.get("hostId");
    const itemId = searchParams.get("itemId");
    const graphId = searchParams.get("graphId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const token = await getAuthToken();
    let result;

    switch (action) {
      // ─── Hosts (with all items) ──────────────────────────────────────────
      case "hosts": {
        result = await zabbixRequest(
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
          token
        );
        break;
      }

      // ─── Items for a specific host ──────────────────────────────────────
      case "items": {
        if (!hostId) {
          return NextResponse.json(
            { success: false, error: "hostId is required" },
            { status: 400 }
          );
        }
        result = await zabbixRequest(
          "item.get",
          {
            output: ["itemid", "name", "key_", "lastvalue", "units", "status", "description", "type"],
            hostids: hostId,
            filter: { status: 0 },
            sortfield: "name",
          },
          token
        );
        break;
      }

      // ─── History for a given item ──────────────────────────────────────
      case "history": {
        if (!itemId) {
          return NextResponse.json(
            { success: false, error: "itemId is required" },
            { status: 400 }
          );
        }
        let historyData = null;
        const historyTypes = [0, 3];
        for (const type of historyTypes) {
          try {
            const data = await zabbixRequest(
              "history.get",
              {
                output: "extend",
                itemids: itemId,
                limit,
                sortfield: "clock",
                sortorder: "DESC",
                history: type,
              },
              token
            );
            if (data && data.length > 0) {
              historyData = data;
              break;
            }
          } catch (e) { /* ignore */ }
        }
        if (!historyData) {
          historyData = await zabbixRequest(
            "history.get",
            { output: "extend", itemids: itemId, limit, sortfield: "clock", sortorder: "DESC" },
            token
          );
        }
        result = historyData;
        break;
      }

      // ─── Triggers ────────────────────────────────────────────────────────
      case "triggers": {
        const params: any = {
          output: ["triggerid", "description", "priority", "status", "value", "lastchange"],
          selectHosts: ["hostid", "host", "name"],
          selectItems: ["itemid", "name", "key_"],
          filter: { status: 0 },
          sortfield: "priority",
          sortorder: "DESC",
          limit: 50,
        };
        if (hostId) params.hostids = hostId;
        result = await zabbixRequest("trigger.get", params, token);
        break;
      }

      // ─── Problems ────────────────────────────────────────────────────────
      case "problems": {
        const params: any = {
          output: ["triggerid", "description", "priority", "status", "value", "lastchange"],
          selectHosts: ["hostid", "host", "name"],
          selectItems: ["itemid", "name", "key_"],
          filter: { value: 1, status: 0 },
          sortfield: "priority",
          sortorder: "DESC",
          limit: 100,
        };
        if (hostId) params.hostids = hostId;
        result = await zabbixRequest("trigger.get", params, token);
        break;
      }

      // ─── Events ──────────────────────────────────────────────────────────
      case "events": {
        const params: any = {
          output: ["eventid", "source", "object", "objectid", "clock", "value", "acknowledged", "ns"],
          selectHosts: ["hostid", "host", "name"],
          selectTriggers: ["triggerid", "description", "priority", "status"],
          sortfield: "clock",
          sortorder: "DESC",
          limit,
          source: 0,
        };
        if (hostId) params.hostids = hostId;
        result = await zabbixRequest("event.get", params, token);
        break;
      }

      // ─── Graph details ──────────────────────────────────────────────────
      case "graph": {
        if (!graphId) {
          return NextResponse.json(
            { success: false, error: "graphId is required" },
            { status: 400 }
          );
        }
        result = await zabbixRequest(
          "graph.get",
          {
            output: ["graphid", "name", "width", "height", "graphtype"],
            graphids: graphId,
            selectGraphItems: ["itemid", "color", "drawtype", "sortorder"],
          },
          token
        );
        break;
      }

      // ─── NEW: ICMP Ping Response Time (enhanced) ──────────────────────
      case "icmp": {
        if (!hostId) {
          return NextResponse.json(
            { success: false, error: "hostId is required" },
            { status: 400 }
          );
        }

        // If an itemId is given, fetch that specific item
        if (itemId) {
          const items = await zabbixRequest(
            "item.get",
            {
              output: ["itemid", "name", "key_", "lastvalue", "units", "status"],
              itemids: itemId,
            },
            token
          );
          if (!items || items.length === 0) {
            return NextResponse.json(
              { success: false, error: "Item not found" },
              { status: 404 }
            );
          }
          const item = items[0];
          const value = parseFloat(item.lastvalue) || 0;
          result = {
            hostId,
            itemId: item.itemid,
            key: item.key_,
            name: item.name,
            value,
            units: item.units || "",
            lastvalue_raw: item.lastvalue,
          };
          break;
        }

        // Otherwise, search for ICMP-related items (multiple keys)
        const itemKeys = ["icmppingsec", "icmpping", "icmppingloss"];
        const items = await zabbixRequest(
          "item.get",
          {
            output: ["itemid", "name", "key_", "lastvalue", "units", "status"],
            hostids: hostId,
            filter: { key_: itemKeys, status: 0 },
            limit: 10,
          },
          token
        );

        if (!items || items.length === 0) {
          return NextResponse.json(
            { success: false, error: "No ICMP items found for this host" },
            { status: 404 }
          );
        }

        // Return all found ICMP items with parsed values
        result = items.map((item: any) => ({
          hostId,
          itemId: item.itemid,
          key: item.key_,
          name: item.name,
          value: parseFloat(item.lastvalue) || 0,
          units: item.units || "",
          lastvalue_raw: item.lastvalue,
          status: item.status,
        }));
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Zabbix API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch data",
      },
      { status: 500 }
    );
  }
}