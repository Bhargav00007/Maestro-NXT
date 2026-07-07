"use client";

import { useState, useMemo } from "react";
import { useDeviceStore } from "@/lib/store";
import DeviceCard from "@/components/DeviceCard";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const devices = useDeviceStore((state) => state.devices);
  const [query, setQuery] = useState("");

  const filteredDevices = useMemo(() => {
    if (!query.trim()) return devices;
    const lowerQuery = query.toLowerCase().trim();
    return devices.filter((device) =>
      device.name.toLowerCase().includes(lowerQuery) ||
      device.ip.toLowerCase().includes(lowerQuery) ||
      device.type.toLowerCase().includes(lowerQuery) ||
      device.region.toLowerCase().includes(lowerQuery)
    );
  }, [devices, query]);

  const clearSearch = () => setQuery("");

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex flex-col items-center justify-start pt-12 sm:pt-16 md:pt-20 ">
        <div className="w-full max-w-xl">
          <div className="relative ">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground " />
            <Input
              type="text"
              placeholder="Search devices by name, IP, type, or region..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 pr-10 text-base shadow-sm"
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
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {filteredDevices.length} device{filteredDevices.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Results grid */}
      <div className="mt-8">
        {filteredDevices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                history={[]} // No history on search page (optional)
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Search className="h-12 w-12 opacity-20" />
            <p className="mt-4 text-lg font-medium">No devices found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}