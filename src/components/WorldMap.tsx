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
];

const standaloneLocation = { name: "Milan", lng: 9.1900, lat: 45.4642 };

const arcs = destinations.map((dest) => ({
  id: dest.name,
  from: [hub.lng, hub.lat] as [number, number],
  to: [dest.lng, dest.lat] as [number, number],
}));

export default function WorldMap() {
  const mapRef = useRef<any>(null);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current;

        // Step 1: Start from Plainsboro
        map.flyTo({
          center: [destinations[0].lng, destinations[0].lat],
          zoom: 4,
          bearing: 0,
          pitch: 0,
          duration: 1000,
        });

        // Step 2: Fly to Ashburn with slight spin
        setTimeout(() => {
          map.flyTo({
            center: [destinations[1].lng, destinations[1].lat],
            zoom: 3.5,
            bearing: 30,
            pitch: 5,
            duration: 1000,
          });
        }, 1000);

        // Step 3: Zoom into Hyderabad with dramatic pitch
        setTimeout(() => {
          map.flyTo({
            center: [hub.lng, hub.lat],
            zoom: 5,
            bearing: 0,
            pitch: 60,
            duration: 3000,
          });
        }, 2000);

        // Step 4: Return to flat top-down view
        setTimeout(() => {
          map.flyTo({
            center: [hub.lng, hub.lat],
            zoom: 5,
            bearing: 0,
            pitch: 0,
            duration: 1000,
          });
        }, 5000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-background">
      <div className="h-full w-full overflow-hidden rounded-lg border bg-background shadow-sm">
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
              <div className="size-2 rounded-full border-2 border-white bg-blue-500 shadow-md sm:size-3" />
              <MarkerLabel
                position="top"
                className="bg-background/80 rounded-sm px-1 py-0.5 text-[9px] font-semibold backdrop-blur sm:px-1.5 sm:text-[11px]"
              >
                {hub.name}
              </MarkerLabel>
            </MarkerContent>
          </MapMarker>

          {destinations.map((dest) => (
            <MapMarker key={dest.name} longitude={dest.lng} latitude={dest.lat}>
              <MarkerContent>
                <div className="size-1.5 rounded-full border-2 border-white bg-emerald-500 shadow sm:size-2" />
                <MarkerLabel position="top" className="text-[8px] sm:text-[10px]">
                  {dest.name}
                </MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ))}

          <MapMarker
            key={standaloneLocation.name}
            longitude={standaloneLocation.lng}
            latitude={standaloneLocation.lat}
          >
            <MarkerContent>
              <div className="size-1.5 rounded-full border-2 border-white bg-purple-500 shadow sm:size-2" />
              <MarkerLabel position="top" className="text-[8px] sm:text-[10px]">
                {standaloneLocation.name}
              </MarkerLabel>
            </MarkerContent>
          </MapMarker>
        </Map>
      </div>
    </div>
  );
}