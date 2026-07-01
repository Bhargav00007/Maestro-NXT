// app/api/zabbix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getZabbixAPI } from "@/lib/zabbix";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "hosts";
    const hostId = searchParams.get("hostId");

    console.log(`=== Zabbix API Request ===`);
    console.log(`Action: ${action}, HostId: ${hostId || 'none'}`);

    const zabbix = getZabbixAPI();
    
    // Get credentials from environment
    const user = process.env.ZABBIX_USER || "Admin";
    const password = process.env.ZABBIX_PASSWORD || "zabbix";

    console.log(`Using credentials - User: "${user}", Password length: ${password ? password.length : 0}`);

    // Try to login with multiple attempts
    let authToken;
    let loginError = null;
    
    try {
      console.log("Attempting Zabbix login...");
      authToken = await zabbix.login(user, password);
      console.log("✅ Zabbix login successful!");
    } catch (error: any) {
      loginError = error;
      console.error("❌ Zabbix login failed:", error.message);
      
      // Try to get API version for debugging
      try {
        console.log("Attempting to get API version...");
        // We need a new instance for version check since login failed
        const testZabbix = new (require('@/lib/zabbix').ZabbixAPI)({
          url: process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix",
          user: user,
          password: password,
        });
        const versionResult = await testZabbix.testConnection();
        console.log("API Version test result:", versionResult);
      } catch (versionError) {
        console.error("Failed to get API version:", versionError);
      }
      
      // Provide helpful error message
      let errorMessage = "Failed to authenticate with Zabbix. ";
      let details: any = {
        user: user,
        url: process.env.NEXT_PUBLIC_ZABBIX_URL,
        api_url: `${process.env.NEXT_PUBLIC_ZABBIX_URL}/api_jsonrpc.php`,
        error: error.message,
      };

      if (error.message.includes("unexpected parameter")) {
        errorMessage += "The API parameter format seems incorrect. This might be a version mismatch.";
        details.suggestion = "Try using the Zabbix API test page to verify the correct parameter format.";
        details.troubleshooting = [
          "Check if Zabbix API version is 3.0 or higher",
          "Try accessing the API directly: " + `${process.env.NEXT_PUBLIC_ZABBIX_URL}/api_jsonrpc.php`,
          "Verify that the Zabbix frontend is accessible",
          "Check if any authentication modules are enabled"
        ];
      } else if (error.message.includes("Cannot connect")) {
        errorMessage += "Cannot reach the Zabbix server.";
        details.suggestion = "Make sure the Zabbix server is running and the URL is correct.";
      } else {
        errorMessage += error.message;
        details.suggestion = "Please check your ZABBIX_USER and ZABBIX_PASSWORD environment variables.";
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: details,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    let result;
    let success = true;

    switch (action) {
      case "hosts":
        console.log("Fetching hosts...");
        result = await zabbix.getHosts();
        console.log(`Found ${result?.length || 0} hosts`);
        break;
      
      case "items":
        if (!hostId) {
          return NextResponse.json(
            { success: false, error: "hostId is required for items action" },
            { status: 400 }
          );
        }
        console.log(`Fetching items for host: ${hostId}`);
        result = await zabbix.getItems(hostId);
        console.log(`Found ${result?.length || 0} items`);
        break;
      
      case "history":
        if (!hostId) {
          return NextResponse.json(
            { success: false, error: "hostId is required for history action" },
            { status: 400 }
          );
        }
        console.log(`Fetching history for item: ${hostId}`);
        result = await zabbix.getHistory(hostId);
        break;
      
      case "triggers":
        console.log("Fetching triggers...");
        result = await zabbix.getTriggers(hostId || undefined);
        console.log(`Found ${result?.length || 0} triggers`);
        break;
      
      case "groups":
        console.log("Fetching host groups...");
        result = await zabbix.getHostGroups();
        console.log(`Found ${result?.length || 0} groups`);
        break;
      
      case "latest":
        if (!hostId) {
          return NextResponse.json(
            { success: false, error: "hostId is required for latest action" },
            { status: 400 }
          );
        }
        console.log(`Fetching latest data for host: ${hostId}`);
        result = await zabbix.getLatestData(hostId);
        break;
      
      case "status":
        if (!hostId) {
          return NextResponse.json(
            { success: false, error: "hostId is required for status action" },
            { status: 400 }
          );
        }
        console.log(`Fetching status for host: ${hostId}`);
        result = await zabbix.getHostStatus(hostId);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Zabbix API request completed in ${duration}ms`);

    return NextResponse.json({ 
      success, 
      data: result,
      action,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("❌ Zabbix API Error:", {
      message: error.message,
      stack: error.stack,
      duration
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch data from Zabbix",
        details: {
          duration,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}