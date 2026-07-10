"use client";

import { useMemo } from "react";
import { useDeviceStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/piechart";
import { Pie, PieChart, Cell, Label } from "recharts";

type HealthStatus = "down" | "warning" | "healthy";

const computeHealth = (device: any): HealthStatus => {
  if (device.status === "down") return "down";

  if (device.highestPriority !== undefined && device.highestPriority >= 2) {
    return "warning";
  }

  if (device.cpu > 80 || device.memory > 85) return "warning";
  return "healthy";
};

const healthConfig = {
  down: { label: "Down", color: "#ef4444" },
  warning: { label: "Warning", color: "#eab308" },
  healthy: { label: "Healthy", color: "#22c55e" },
} satisfies ChartConfig;

export default function RegionHealthPieCharts() {
  const devices = useDeviceStore((state) => state.devices);

  const regionData = useMemo(() => {
    const regions = ["culpepper", "plainsboro", "hyderabad"];
    return regions.map((region) => {
      const regionDevices = devices.filter(
        (d) => d.region.toLowerCase() === region
      );
      const counts = { down: 0, warning: 0, healthy: 0 };
      regionDevices.forEach((d) => {
        const health = computeHealth(d);
        counts[health] += 1;
      });
      const chartData = Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          status,
          count,
          fill: healthConfig[status as keyof typeof healthConfig]?.color || "#gray",
        }));
      const displayName = region.charAt(0).toUpperCase() + region.slice(1);
      return { region: displayName, total: regionDevices.length, ...counts, chartData };
    });
  }, [devices]);

  if (devices.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Culpepper", "Plainsboro", "Hyderabad"].map((region) => (
          <Card key={region} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm">{region}</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No data yet</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {regionData.map(({ region, total, down, warning, healthy, chartData }) => (
        <Card key={region} className="flex flex-col">
          <CardHeader className="items-center pb-2 pt-4">
            <CardTitle className="capitalize text-lg font-semibold">{region}</CardTitle>
            <CardDescription className="text-xs flex flex-wrap gap-1">
              <span>{total} device{total !== 1 ? "s" : ""}</span>
              {down > 0 && (
                <span className="text-red-500 font-medium">{down} down</span>
              )}
              {down > 0 && warning > 0 && " · "}
              {warning > 0 && (
                <span className="text-yellow-500 font-medium">{warning} warning</span>
              )}
              {healthy > 0 && (
                <span className="text-green-500 font-medium">
                  {healthy} healthy
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-2 pt-0 px-2">
            <ChartContainer
              config={healthConfig}
              className="mx-auto aspect-square max-h-[180px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="count"
                      hideLabel
                      formatter={(value: number, name: string) => (
                        <span className="capitalize">{name}: {value}</span>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={2}
                  cornerRadius={12}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const cx = (viewBox as any)?.cx;
                      const cy = (viewBox as any)?.cy;
                      if (cx === undefined || cy === undefined) return null;
                      return (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs fill-muted-foreground"
                        >
                          {total}
                          <tspan x={cx} y={cy + 16} className="text-[10px]">
                            devices
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}