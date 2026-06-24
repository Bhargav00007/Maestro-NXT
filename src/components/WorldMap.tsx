"use client";

import {
  Map,
  MapArc,
  MapMarker,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/mapcn-map-arc";
import { useEffect, useRef } from "react";

const hub = { name: "Hyderabad", lng: 78.4867, lat: 17.3850 };

const destinations = [
  { name: "Plainsboro", lng: -74.599, lat: 40.3345 },
  { name: "Ashburn", lng: -77.4874, lat: 39.0438 },
  { name: "Singapore", lng: 103.8198, lat: 1.3521 },
];

const standaloneLocation = { name: "Milan", lng: 9.1900, lat: 45.4642 };

const arcs = destinations.map((dest) => ({
  id: dest.name,
  from: [hub.lng, hub.lat] as [number, number],
  to: [dest.lng, dest.lat] as [number, number],
}));

export default function WorldMap() {
  const mapRef = useRef<any>(null);

  // Animation on mount - total duration 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current;

        // Step 1: Start from Plainsboro (0 - 1s)
        map.flyTo({
          center: [destinations[0].lng, destinations[0].lat],
          zoom: 4,
          bearing: 0,
          pitch: 0,
          duration: 1000,
        });

        // Step 2: Fly to Ashburn with slight spin (1s - 2s)
        setTimeout(() => {
          map.flyTo({
            center: [destinations[1].lng, destinations[1].lat],
            zoom: 3.5,
            bearing: 30,
            pitch: 5,
            duration: 1000,
          });
        }, 1000);

        // Step 3: Final zoom into Hyderabad with spin (2s - 3s)
        setTimeout(() => {
          map.flyTo({
            center: [hub.lng, hub.lat],
            zoom: 12,
            bearing: 0,
            pitch: 60,
            duration: 3000,
          });
        }, 2000);
      }
    }, 1000); // 1 second delay for map to load

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex w-full items-center justify-center overflow-hidden bg-background p-2">
      <div className="h-[420px] w-full max-w-6xl overflow-hidden rounded-lg border bg-background shadow-sm">
        <Map
          ref={mapRef}
          center={[hub.lng, hub.lat]}
          zoom={1.5}
          projection={{ type: "globe" }}
        >
          <MapArc
            data={arcs}
            paint={{ "line-color": "#0b5ada", "line-dasharray": [2, 2] }}
            interactive={false}
          />

          <MapMarker longitude={hub.lng} latitude={hub.lat}>
            <MarkerContent>
              <div className="size-3 rounded-full border-2 border-white bg-blue-500 shadow-md" />
              <MarkerLabel
                position="top"
                className="bg-background/80 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur"
              >
                {hub.name}
              </MarkerLabel>
            </MarkerContent>
          </MapMarker>

          {/* Connected destinations markers */}
          {destinations.map((dest) => (
            <MapMarker key={dest.name} longitude={dest.lng} latitude={dest.lat}>
              <MarkerContent>
                <div className="size-2 rounded-full border-2 border-white bg-emerald-500 shadow" />
                <MarkerLabel position="top">{dest.name}</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ))}

          {/* Standalone marker in Italy - no arc connection */}
          <MapMarker
            key={standaloneLocation.name}
            longitude={standaloneLocation.lng}
            latitude={standaloneLocation.lat}
          >
            <MarkerContent>
              <div className="size-2 rounded-full border-2 border-white bg-purple-500 shadow" />
              <MarkerLabel position="top">{standaloneLocation.name}</MarkerLabel>
            </MarkerContent>
          </MapMarker>
        </Map>
      </div>
    </div>
  );
}