"use client";

import {
  Map,
  MapArc,
  MapMarker,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/mapcn-map-arc";
import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Home } from "lucide-react";

const hub = { name: "Hyderabad", lng: 78.4867, lat: 17.3850 };

const destinations = [
  { name: "Plainsboro", lng: -74.599, lat: 40.3345 },
  { name: "Culpepper", lng: -77.9964, lat: 38.4732 }, 
];

const standaloneLocation = { name: "Milan", lng: 9.1900, lat: 45.4642 };

const arcs = destinations.map((dest) => ({
  id: dest.name,
  from: [hub.lng, hub.lat] as [number, number],
  to: [dest.lng, dest.lat] as [number, number],
}));

export default function WorldMap() {
  const mapRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const flyToHyderabad = () => {
    if (mapRef.current) {
      setIsAnimating(true);
      const map = mapRef.current;
      
      map.flyTo({
        center: [hub.lng, hub.lat],
        zoom: 5,
        bearing: 0,
        pitch: 60,
        duration: 2000,
      });

      setTimeout(() => {
        map.flyTo({
          center: [hub.lng, hub.lat],
          zoom: 5,
          bearing: 0,
          pitch: 0,
          duration: 1500,
        });
        setTimeout(() => setIsAnimating(false), 2000);
      }, 2000);
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const currentZoom = map.getZoom();
      map.flyTo({
        zoom: Math.min(currentZoom + 1, 20),
        duration: 500,
      });
    }
  };

  // Function to zoom out
  const zoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const currentZoom = map.getZoom();
      map.flyTo({
        zoom: Math.max(currentZoom - 1, 1),
        duration: 500,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current;

        map.flyTo({
          center: [destinations[0].lng, destinations[0].lat],
          zoom: 4,
          bearing: 0,
          pitch: 0,
          duration: 1000,
        });

        setTimeout(() => {
          map.flyTo({
            center: [destinations[1].lng, destinations[1].lat],
            zoom: 3.5,
            bearing: 30,
            pitch: 5,
            duration: 1000,
          });
        }, 1000);

        setTimeout(() => {
          map.flyTo({
            center: [hub.lng, hub.lat],
            zoom: 5,
            bearing: 0,
            pitch: 60,
            duration: 3000,
          });
        }, 2000);

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
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-background relative">
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

      <div className="absolute bottom-10 right-4 flex flex-col gap-1.5">
        <button
          onClick={zoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:shadow-xl border"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={zoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:shadow-xl border"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          onClick={flyToHyderabad}
          disabled={isAnimating}
          className={`flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:shadow-xl border ${
            isAnimating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Fly to Hyderabad"
        >
          <Home className={`h-4 w-4 ${isAnimating ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
}