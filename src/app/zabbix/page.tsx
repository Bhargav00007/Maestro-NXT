// app/zabbix/page.tsx
import ZabbixTest from "@/components/zabbixTest";

export const metadata = {
  title: "Zabbix Integration",
  description: "View Zabbix monitoring data",
};

export default function ZabbixPage() {
  return (
    <div className="container mx-auto py-8">
      <ZabbixTest />
    </div>
  );
}