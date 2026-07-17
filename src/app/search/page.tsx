"use client";

import { useState, useMemo } from "react";
import { useDeviceStore } from "@/lib/store";
import DeviceCard from "@/components/DeviceCard";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const devices = useDeviceStore((state) => state.devices);
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });
    return counts;
  }, [devices]);

  const types = Object.keys(typeCounts).sort();

  const filteredDevices = useMemo(() => {
    let result = devices;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(
        (device) =>
          device.name.toLowerCase().includes(lowerQuery) ||
          device.ip.toLowerCase().includes(lowerQuery) ||
          device.type.toLowerCase().includes(lowerQuery) ||
          device.region.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedType) {
      result = result.filter((device) => device.type === selectedType);
    }

    return result;
  }, [devices, query, selectedType]);

  const clearSearch = () => setQuery("");

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
  };

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 xl:max-w-full xl:px-20">
      <div className="flex flex-col items-center justify-start pt-12 sm:pt-16 md:pt-20">
        <div className="w-full max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search devices by name, IP, type, or region..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 pr-10 text-base shadow-sm border border-gray-400"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          {types.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mr-1">
              </div>

              <button
                onClick={() => handleTypeFilter(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedType === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                All ({devices.length})
              </button>

              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeFilter(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    selectedType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {type} ({typeCounts[type]})
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      <div className="mt-8">
        {filteredDevices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                history={[]}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Search className="h-12 w-12 opacity-20" />
            <p className="mt-4 text-lg font-medium">No devices found</p>
            <p className="text-sm">Try adjusting your search terms or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}