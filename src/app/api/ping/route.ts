// app/api/ping/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const host = searchParams.get("host");

  if (!host) {
    return NextResponse.json(
      { error: "Host parameter is required" },
      { status: 400 }
    );
  }

  try {
    const isWindows = process.platform === "win32";
    const count = isWindows ? "-n 4" : "-c 4";
    const command = `ping ${count} ${host}`;
    const { stdout, stderr } = await execPromise(command);
    // Some ping implementations send warnings to stderr; we include both
    const output = stdout + (stderr || "");
    return NextResponse.json({ output });
  } catch (error: any) {
    // On failure, we still might have partial output
    return NextResponse.json(
      {
        error: error.message || "Ping failed",
        output: error.stdout || "",
      },
      { status: 500 }
    );
  }
}