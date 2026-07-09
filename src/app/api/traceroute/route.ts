// app/api/traceroute/route.ts
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
    // Use -d on Windows to avoid DNS lookups (faster)
    const command = isWindows
      ? `tracert -d -h 30 ${host}`
      : `traceroute -n -m 30 ${host}`;
    const { stdout, stderr } = await execPromise(command, { timeout: 60000 });
    const output = stdout + (stderr || "");
    // Even if stderr has warnings, we return success
    return NextResponse.json({ output });
  } catch (error: any) {
    // On failure, we may still have partial output.
    // Return 200 with the output we got, and include an error message as a warning.
    const output = error.stdout || "";
    const errorMsg = error.message || "Traceroute failed";
    return NextResponse.json(
      {
        output: output || `Error: ${errorMsg}`,
        warning: "Traceroute completed with errors (some hops may have timed out).",
      },
      { status: 200 } // still return 200 so the modal shows the output
    );
  }
}