import WorldMap from "@/components/WorldMap";
import React from "react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className=" bg-background/80 px-6 py-5 backdrop-blur-sm sm:px-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-4xl">
          Global Network
        </h1>
        <p className="mt-1 text-base text-muted-foreground sm:text-lg">
          Connecting cities across the world
        </p>
      </header>

      <div className="flex-1">
        <WorldMap />
      </div>
    </div>
  );
}
