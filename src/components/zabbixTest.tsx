"use client";

import { useState } from "react";
import { Loader2, Server, Cpu, MemoryStick, Activity, AlertTriangle, RefreshCw, ChevronLeft, Wifi, WifiOff, Bug, Circle, CircleCheck, CircleX, CircleDot } from "lucide-react";

interface ZabbixHost {
  hostid: string;
  host: string;
  name?: string;
  status?: string;
  available?: string;
  error?: string;
}

interface ZabbixItem {
  status: string;
  itemid: string;
  name: string;
  key_: string;
  lastvalue?: string;
  units?: string;
  error?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: any;
  action?: string;
  duration?: number;
  timestamp?: string;
}

export default function ZabbixTest() {
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);
  const [items, setItems] = useState<ZabbixItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hosts' | 'items' | 'data'>('hosts');
  const [apiDetails, setApiDetails] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [hostStatus, setHostStatus] = useState<any>(null);

  const runDirectAPITest = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);
    setHosts([]);
    setRawApiResponse(null);
    
    try {
      const zabbixUrl = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
      const apiUrl = `${zabbixUrl}/api_jsonrpc.php`;
      
      
      const results: any = {
        apiUrl,
        tests: [],
        environment: {
          zabbixUrl,
          apiUrl,
          user: process.env.ZABBIX_USER || "Admin",
          passwordLength: (process.env.ZABBIX_PASSWORD || "zabbix").length,
        }
      };

      try {
        console.log("Testing API endpoint...");
        const pingResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json-rpc" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "apiinfo.version",
            params: {},
            id: 1,
          }),
        });
        const pingData = await pingResponse.json();
        results.tests.push({
          name: "API Endpoint Test",
          description: "Checking if the API endpoint is accessible",
          success: pingResponse.ok,
          data: pingData,
          status: pingResponse.status
        });
        console.log("API endpoint test result:", pingData);
        
        if (pingData) {
          setRawApiResponse(pingData);
        }
      } catch (err: any) {
        results.tests.push({
          name: "API Endpoint Test",
          description: "Checking if the API endpoint is accessible",
          success: false,
          error: err.message,
          status: 500
        });
        console.error("API endpoint test failed:", err.message);
      }

      const workingFormat = { 
        name: "Format 4 (username/password)", 
        params: { 
          username: process.env.ZABBIX_USER || "Admin", 
          password: process.env.ZABBIX_PASSWORD || "zabbix" 
        } 
      };

      console.log(`Trying ${workingFormat.name}...`);
      try {
        const requestBody: any = {
          jsonrpc: "2.0",
          method: "user.login",
          id: Date.now() + Math.random(),
          params: workingFormat.params,
        };

        const loginResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json-rpc" },
          body: JSON.stringify(requestBody),
        });
        
        const loginData = await loginResponse.json();
        
        const testResult = {
          name: workingFormat.name,
          params: workingFormat.params,
          success: !loginData.error,
          data: loginData,
          status: loginResponse.status,
        };
        
        results.tests.push(testResult);
        console.log(`${loginData.error ? 'Error' : 'No error'} ${workingFormat.name}:`, loginData);
        
        if (!loginData.error && loginData.result) {
          console.log("Login successful! Fetching hosts...");
          const token = loginData.result;
          
          const hostsResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json-rpc" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "host.get",
              params: {
                output: ["hostid", "host", "name", "status", "available", "error"],
                selectInterfaces: ["ip", "dns", "port", "type"],
                selectItems: ["itemid", "name", "key_", "lastvalue", "units"],
                selectTriggers: ["triggerid", "description", "priority", "status", "value"],
              },
              auth: token,
              id: Date.now() + Math.random(),
            }),
          });
          
          const hostsData = await hostsResponse.json();
          
          if (!hostsData.error) {
            const hostList = hostsData.result || [];
            setHosts(hostList);
            
            const available = hostList.filter((h: any) => h.available === "0").length;
            const unavailable = hostList.filter((h: any) => h.available === "1").length;
            const unknown = hostList.filter((h: any) => h.available === "2").length;
            
            setHostStatus({ available, unavailable, unknown, total: hostList.length });
            
            results.tests.push({
              name: `Get Hosts`,
              success: true,
              hostCount: hostList.length,
              data: hostsData,
              statusSummary: { available, unavailable, unknown }
            });
            setApiDetails({ success: true, data: hostList });
            console.log(`Found ${hostList.length} hosts`);
          } else {
            results.tests.push({
              name: `Get Hosts`,
              success: false,
              error: hostsData.error,
              data: hostsData,
            });
          }
        }
      } catch (err: any) {
        console.error(`❌ ${workingFormat.name} failed:`, err.message);
        results.tests.push({
          name: workingFormat.name,
          params: workingFormat.params,
          success: false,
          error: err.message,
          status: 500,
        });
      }

      setTestResults(results);

      if (hosts.length === 0) {
        setError("Login successful but no hosts found. Your Zabbix might not have any hosts configured.");
      }

    } catch (err: any) {
      console.error("❌ Test failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hosts using the API route
  const fetchHosts = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);
    try {
      const response = await fetch("/api/zabbix?action=hosts");
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setHosts(data.data || []);
        setApiDetails(data);
        setActiveTab('hosts');
      } else {
        setError(data.error || "Failed to fetch hosts");
        console.error("API Error Details:", data.details);
        setApiDetails(data);
      }
    } catch (err) {
      setError("Network error while fetching hosts. Please check if the server is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (hostId: string) => {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const zabbixUrl = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
      const apiUrl = `${zabbixUrl}/api_jsonrpc.php`;
      
      const loginResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "user.login",
          params: {
            username: process.env.ZABBIX_USER || "Admin",
            password: process.env.ZABBIX_PASSWORD || "zabbix",
          },
          id: Date.now() + Math.random(),
        }),
      });
      
      const loginData = await loginResponse.json();
      
      if (loginData.error) {
        setError(`Login failed: ${loginData.error.message}`);
        setLoading(false);
        return;
      }
      
      const token = loginData.result;
      
      const itemsResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "item.get",
          params: {
            output: ["itemid", "name", "key_", "lastvalue", "units", "status", "type", "description"],
            hostids: hostId,
            sortfield: "name",
          },
          auth: token,
          id: Date.now() + Math.random(),
        }),
      });
      
      const itemsData = await itemsResponse.json();
      
      if (!itemsData.error) {
        setItems(itemsData.result || []);
        setActiveTab('items');
        setApiDetails({ success: true, data: itemsData.result });
        console.log(`Found ${itemsData.result?.length || 0} items for host ${hostId}`);
      } else {
        setError(`Failed to fetch items: ${itemsData.error.message || 'Unknown error'}`);
        console.error("Items Error:", itemsData.error);
      }
    } catch (err) {
      setError("Network error while fetching items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestData = async (hostId: string) => {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const zabbixUrl = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
      const apiUrl = `${zabbixUrl}/api_jsonrpc.php`;
      
      // First login to get token
      const loginResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "user.login",
          params: {
            username: process.env.ZABBIX_USER || "Admin",
            password: process.env.ZABBIX_PASSWORD || "zabbix",
          },
          id: Date.now() + Math.random(),
        }),
      });
      
      const loginData = await loginResponse.json();
      
      if (loginData.error) {
        setError(`Login failed: ${loginData.error.message}`);
        setLoading(false);
        return;
      }
      
      const token = loginData.result;
      
      // Fetch latest data (items with lastvalue)
      const itemsResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json-rpc" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "item.get",
          params: {
            output: ["itemid", "name", "key_", "lastvalue", "units", "status", "type", "description"],
            hostids: hostId,
            filter: {
              status: "0" // Only active items
            },
            sortfield: "name",
          },
          auth: token,
          id: Date.now() + Math.random(),
        }),
      });
      
      const itemsData = await itemsResponse.json();
      
      if (!itemsData.error) {
        // Filter to show only items with values
        const itemsWithValues = (itemsData.result || []).filter((item: any) => item.lastvalue);
        setItems(itemsWithValues);
        setActiveTab('data');
        setApiDetails({ success: true, data: itemsWithValues });
        console.log(` Found ${itemsWithValues.length} items with data for host ${hostId}`);
      } else {
        setError(`Failed to fetch data: ${itemsData.error.message || 'Unknown error'}`);
        console.error("Data Error:", itemsData.error);
      }
    } catch (err) {
      setError("Network error while fetching data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHostClick = (host: ZabbixHost) => {
    setSelectedHost(host);
    fetchItems(host.hostid);
  };

  const handleViewData = (host: ZabbixHost) => {
    setSelectedHost(host);
    fetchLatestData(host.hostid);
  };

  const handleBackToHosts = () => {
    setActiveTab('hosts');
    setSelectedHost(null);
    setItems([]);
  };

  const getStatusBadge = (status?: string) => {
    if (status === "0") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CircleCheck className="h-3 w-3" /> Available</span>;
    }
    if (status === "1") {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1"><CircleX className="h-3 w-3" /> Unavailable</span>;
    }
    if (status === "2") {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><CircleDot className="h-3 w-3" /> Unknown</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center gap-1"><Circle className="h-3 w-3" /> N/A</span>;
  };

  const getHostStatusIcon = (status?: string) => {
    if (status === "0") return <CircleCheck className="h-4 w-4 text-green-500" />;
    if (status === "1") return <CircleX className="h-4 w-4 text-red-500" />;
    if (status === "2") return <CircleDot className="h-4 w-4 text-yellow-500" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getItemTypeIcon = (key: string) => {
    if (key.includes('icmp')) return <Wifi className="h-4 w-4 text-cyan-500" />;
    if (key.includes('cpu')) return <Cpu className="h-4 w-4 text-blue-500" />;
    if (key.includes('memory') || key.includes('mem')) return <MemoryStick className="h-4 w-4 text-purple-500" />;
    if (key.includes('traffic') || key.includes('net')) return <Activity className="h-4 w-4 text-green-500" />;
    return <Server className="h-4 w-4 text-gray-500" />;
  };

  const getItemStatusBadge = (status?: string) => {
    if (status === "0") {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
    }
    if (status === "1") {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Disabled</span>;
    }
    if (status === "2") {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Unsupported</span>;
    }
    if (status === "3") {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Not Supported</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">Unknown</span>;
  };

  const formatValue = (value?: string, units?: string, key?: string) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (key && key.includes('icmp') && units === 's') {
      if (num < 1) {
        return `${(num * 1000).toFixed(1)} ms`;
      } else {
        return `${num.toFixed(1)} s`;
      }
    }
    
    if (units === '%') return `${num.toFixed(1)}%`;
    if (units === 'bps' || units === 'Bps') {
      if (num > 1000000) return `${(num / 1000000).toFixed(2)} Mbps`;
      if (num > 1000) return `${(num / 1000).toFixed(2)} Kbps`;
      return `${num.toFixed(0)} bps`;
    }
    if (units === 'B' || units === 'bytes') {
      if (num > 1073741824) return `${(num / 1073741824).toFixed(2)} GB`;
      if (num > 1048576) return `${(num / 1048576).toFixed(2)} MB`;
      if (num > 1024) return `${(num / 1024).toFixed(2)} KB`;
      return `${num.toFixed(0)} B`;
    }
    if (units === 's' || units === 'sec') {
      if (num > 3600) return `${(num / 3600).toFixed(1)}h`;
      if (num > 60) return `${(num / 60).toFixed(1)}m`;
      return `${num.toFixed(0)}s`;
    }
    return `${value}${units ? ' ' + units : ''}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-yellow-500" />
            Zabbix Debug Tool
          </h2>
          <p className="text-sm text-muted-foreground">
            Connected to: {process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix"}
          </p>
          <p className="text-xs text-muted-foreground">
            API Endpoint: {(process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix") + "/api_jsonrpc.php"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runDirectAPITest}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            {loading ? "Testing..." : "Test Connection"}
          </button>
          <button
            onClick={fetchHosts}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Hosts
          </button>
        </div>
      </div>

      {/* Host Status Summary */}
      {hostStatus && hosts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-green-50 border-green-200">
            <p className="text-xs text-green-600">Available</p>
            <p className="text-xl font-bold text-green-700">{hostStatus.available}</p>
          </div>
          <div className="p-3 rounded-lg border bg-red-50 border-red-200">
            <p className="text-xs text-red-600">Unavailable</p>
            <p className="text-xl font-bold text-red-700">{hostStatus.unavailable}</p>
          </div>
          <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-600">Unknown</p>
            <p className="text-xl font-bold text-yellow-700">{hostStatus.unknown}</p>
          </div>
          <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-600">Total</p>
            <p className="text-xl font-bold text-blue-700">{hostStatus.total}</p>
          </div>
        </div>
      )}

      {/* Raw API Response */}
      {rawApiResponse && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <details>
            <summary className="cursor-pointer font-semibold text-blue-800 flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              API Raw Response (Click to expand)
            </summary>
            <pre className="mt-2 p-2 bg-blue-100 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(rawApiResponse, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold">API Test Results</h3>
              <p className="text-xs text-muted-foreground">Testing connection to Zabbix API</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              {testResults.tests.filter((t: any) => t.success).length} successful tests
            </span>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {testResults.tests.map((test: any, index: number) => (
              <div key={index} className="p-4 hover:bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {test.success ? (
                        <span className="text-green-500">Success</span>
                      ) : (
                        <span className="text-red-500">Failed</span>
                      )}
                      <span className="font-medium">{test.name}</span>
                      {test.params && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {JSON.stringify(test.params)}
                        </span>
                      )}
                      {test.hostCount !== undefined && (
                        <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                          {test.hostCount} hosts
                        </span>
                      )}
                      {test.statusSummary && (
                        <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                          🟢 {test.statusSummary.available} 🔴 {test.statusSummary.unavailable} 🟡 {test.statusSummary.unknown}
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-xs text-muted-foreground mt-1">{test.description}</p>
                    )}
                    {test.error && (
                      <p className="text-sm text-red-600 mt-1">{test.error}</p>
                    )}
                    {test.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View Response
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-900 text-white rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    Status: {test.status || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
              {apiDetails?.details && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-red-600">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                    {JSON.stringify(apiDetails.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back Button when viewing items */}
      {activeTab !== 'hosts' && (
        <button
          onClick={handleBackToHosts}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Hosts
        </button>
      )}


      {!loading && hosts.length > 0 && activeTab === 'hosts' && (
        <div className="rounded-lg border">
          <div className="px-4 py-3 border-b bg-muted/50 flex items-center justify-between">
            <h3 className="font-semibold">Hosts ({hosts.length})</h3>
            <span className="text-xs text-muted-foreground">
              {hosts.filter(h => h.available === "0").length} available
            </span>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {hosts.map((host) => (
              <div key={host.hostid} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {getHostStatusIcon(host.available)}
                      <p className="font-medium truncate">{host.name || host.host}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">ID: {host.hostid}</p>
                    {host.host !== host.name && (
                      <p className="text-xs text-muted-foreground truncate">Hostname: {host.host}</p>
                    )}
                    {host.error && (
                      <p className="text-xs text-red-500 truncate">Error: {host.error}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(host.available)}
                    <button
                      onClick={() => handleHostClick(host)}
                      className="px-3 py-1 text-sm rounded-md border hover:bg-accent transition-colors whitespace-nowrap"
                    >
                      View Items
                    </button>
                    <button
                      onClick={() => handleViewData(host)}
                      className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      View Data
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {!loading && selectedHost && (activeTab === 'items' || activeTab === 'data') && (
        <div className="rounded-lg border">
          <div className="px-4 py-3 border-b bg-muted/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">
                  {activeTab === 'data' ? 'Latest Metrics' : 'Items'} for: {selectedHost.name || selectedHost.host}
                </h3>
                <p className="text-xs text-muted-foreground">Host ID: {selectedHost.hostid}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {items.length} items found
                </span>
                <button
                  onClick={handleBackToHosts}
                  className="px-3 py-1 text-sm rounded-md border hover:bg-accent transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
          {items.length > 0 ? (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.itemid} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 flex-shrink-0">
                        {getItemTypeIcon(item.key_)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">Key: {item.key_}</p>
                        <p className="text-xs text-muted-foreground">ID: {item.itemid}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-sm font-semibold">
                        {formatValue(item.lastvalue, item.units, item.key_)}
                      </p>
                      <div className="flex items-center gap-2">
                        {getItemStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No items found for this host</p>
              <p className="text-xs">Try checking if the host has any active items configured</p>
            </div>
          )}
        </div>
      )}


      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading data...</span>
        </div>
      )}

      {!loading && hosts.length === 0 && !error && !testResults && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No data loaded</p>
          <p className="text-sm">Click "Test Connection" to connect to Zabbix API.</p>
        </div>
      )}
    </div>
  );
}