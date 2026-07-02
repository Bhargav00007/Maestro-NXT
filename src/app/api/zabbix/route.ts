import { NextRequest, NextResponse } from "next/server";

const ZABBIX_URL = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
const API_URL = `${ZABBIX_URL}/api_jsonrpc.php`;
const USER = process.env.ZABBIX_USER || "Admin";
const PASSWORD = process.env.ZABBIX_PASSWORD || "zabbix";

async function zabbixRequest(method: string, params: any = {}, token?: string) {
  const body: any = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
  };

  if (token) {
    body.auth = token;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json-rpc",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`${data.error.message} (Code: ${data.error.code})`);
  }

  return data.result;
}

async function getAuthToken() {
  try {
    const result = await zabbixRequest("user.login", {
      username: USER,
      password: PASSWORD,
    });
    return result;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    throw error;
  }
}

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
            filter: {
              status: 0,
            },
          },
          token
        );
        break;
      }

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
            output: [
              "itemid",
              "name",
              "key_",
              "lastvalue",
              "units",
              "status",
              "description",
              "type",
            ],
            hostids: hostId,
            filter: {
              status: 0,
            },
            sortfield: "name",
          },
          token
        );
        break;
      }

      case "history": {
        if (!itemId) {
          return NextResponse.json(
            { success: false, error: "itemId is required" },
            { status: 400 }
          );
        }

        // Try different history types
        let historyData = null;
        const historyTypes = [0, 3]; // 0 = float, 3 = integer

        for (const type of historyTypes) {
          try {
            const data = await zabbixRequest(
              "history.get",
              {
                output: "extend",
                itemids: itemId,
                limit: limit,
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
          } catch (e) {
            // Try next type
          }
        }

        if (!historyData) {
          historyData = await zabbixRequest(
            "history.get",
            {
              output: "extend",
              itemids: itemId,
              limit: limit,
              sortfield: "clock",
              sortorder: "DESC",
            },
            token
          );
        }

        result = historyData;
        break;
      }

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