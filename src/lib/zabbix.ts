// lib/zabbix.ts
interface ZabbixConfig {
  url: string;
  user: string;
  password: string;
}

interface ZabbixHost {
  hostid: string;
  host: string;
  name?: string;
  status?: string;
  available?: string;
}

interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue?: string;
  units?: string;
  status?: string;
}

export class ZabbixAPI {
  private url: string;
  private auth: string | null = null;
  private apiUrl: string;
  private debug: boolean = true;
  private apiVersion: string = '2.0';

  constructor(config: ZabbixConfig) {
    this.url = config.url.replace(/\/$/, '');
    this.apiUrl = `${this.url}/api_jsonrpc.php`;
    if (this.debug) {
    }
  }

  private async request(method: string, params: any = {}, id: number = 1) {
    const body: any = {
      jsonrpc: this.apiVersion,
      method: method,
      id: id,
    };

    if (method === "user.login") {
      body.params = params;
    } else {
      body.params = params;
      if (this.auth) {
        body.auth = this.auth;
      }
    }

    if (this.debug) {
      console.log(`Zabbix Request - Method: ${method}`, {
        body: JSON.stringify(body, null, 2),
        url: this.apiUrl,
      });
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-rpc",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (this.debug) {
      }

      if (data.error) {
        if (data.error.code === -32602 && data.error.data?.includes('unexpected parameter')) {
          throw new Error(`Zabbix API parameter error: ${data.error.data}. This might be a version mismatch.`);
        }
        throw new Error(`Zabbix API Error (${data.error.code}): ${data.error.message} - ${data.error.data || ''}`);
      }

      return data.result;
    } catch (error: any) {
      if (this.debug) {
      }
      throw error;
    }
  }

  async login(user: string, password: string) {
    const loginAttempts = [
      { user, password },
      { username: user, passwd: password },
      { user, passwd: password },
      { username: user, password },
      { login: user, password },
      { name: user, password },
      { user, pass: password },
      { username: user, pass: password },
    ];

    let lastError: any = null;

    for (const params of loginAttempts) {
      try {
        if (this.debug) {
        }
        const result = await this.request("user.login", params);
        if (result !== undefined && result !== null) {
          this.auth = result;
          if (this.debug) {
          }
          return result;
        }
        lastError = new Error("Login returned no auth token");
      } catch (error: any) {
        lastError = error;
        if (this.debug) {
          console.log("Login attempt failed:", params, error.message || error);
        }
      }
    }

    if (this.debug) {
    }
    throw new Error(`Zabbix login failed: ${lastError?.message || lastError || 'Unknown error'}`);
  }

  async getHosts() {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    return this.request("host.get", {
      output: ["hostid", "host", "name", "status", "available"],
      selectInterfaces: ["ip", "dns", "port"],
    });
  }

  async getItems(hostId: string) {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    return this.request("item.get", {
      output: ["itemid", "name", "key_", "lastvalue", "units", "status"],
      hostids: hostId,
    });
  }

  async getHistory(itemId: string, limit: number = 100) {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    return this.request("history.get", {
      output: "extend",
      itemids: itemId,
      limit: limit,
      sortfield: "clock",
      sortorder: "DESC",
    });
  }

  async getTriggers(hostId?: string) {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    const params: any = {
      output: ["triggerid", "description", "priority", "status", "value"],
      selectHosts: ["hostid", "host"],
      selectItems: ["itemid", "name"],
    };

    if (hostId) {
      params.hostids = hostId;
    }

    return this.request("trigger.get", params);
  }

  async getHostGroups() {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    return this.request("hostgroup.get", {
      output: ["groupid", "name"],
    });
  }

  async getLatestData(hostId: string) {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    const items = await this.getItems(hostId);
    const importantMetrics = items.filter(
      (item: any) =>
        item.key_.includes("cpu") ||
        item.key_.includes("memory") ||
        item.key_.includes("load") ||
        item.key_.includes("traffic") ||
        item.key_.includes("net.if")
    );
    return importantMetrics;
  }

  async getHostStatus(hostId: string) {
    if (!this.auth) {
      throw new Error("Not authenticated. Please login first.");
    }
    const host = await this.request("host.get", {
      output: ["hostid", "host", "status", "available"],
      hostids: hostId,
    });
    return host[0] || null;
  }

  async testConnection() {
    try {
      const version = await this.request("apiinfo.version", {});
      return { success: true, version };
    } catch (error) {
      return { success: false, error };
    }
  }
}

let zabbixInstance: ZabbixAPI | null = null;

export function getZabbixAPI(): ZabbixAPI {
  if (!zabbixInstance) {
    const url = process.env.NEXT_PUBLIC_ZABBIX_URL || "http://172.24.192.57/zabbix";
    const user = process.env.ZABBIX_USER || "Admin";
    const password = process.env.ZABBIX_PASSWORD || "zabbix";

    console.log("Creating Zabbix API instance with:", {
      url: url,
      user: user,
      passwordLength: password ? password.length : 0,
    });

    zabbixInstance = new ZabbixAPI({
      url: url,
      user: user,
      password: password,
    });
  }
  return zabbixInstance;
}