"use client";

import { BarLoader } from "react-spinners";
import { pixelFont } from "@/lib/fonts";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <h1 className=" mb-2 text-center text-xl font-semibold md:text-3xl">
        MAESTRO{" "}
        <span className={`${pixelFont.className} text-lg md:text-lg`}>NXT</span>
      </h1>

      <BarLoader color="#3b82f6" width={220} height={6} loading={true} />
    </div>
  );
}
