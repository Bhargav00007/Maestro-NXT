"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, Check, X, Loader2 } from "lucide-react";

interface PingButtonProps {
  ip: string;
  hostId?: string;
}

export default function PingButton({ ip, hostId }: PingButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePing = async () => {
    setOpen(true);
    setLoading(true);
    setResult("");
    setError(null);
    setCopied(false);

    try {
      const url = `/api/ping?host=${encodeURIComponent(ip)}&hostId=${encodeURIComponent(hostId || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setResult(data.output || "No output");
      } else {
        setError(data.error || "Ping failed");
        setResult(data.output || "");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    const text = result || error || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePing} className="flex items-center gap-1">
        <Terminal className="h-4 w-4" />
        Ping
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Ping Result for {ip}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2">Pinging...</span>
                </div>
              ) : (
                <pre className="bg-muted/30 p-4 rounded-md text-sm font-mono whitespace-pre-wrap break-words max-h-60 overflow-auto">
                  {result || error || "No output"}
                </pre>
              )}
              {error && !loading && (
                <p className="text-red-500 text-sm mt-2">Error: {error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
                disabled={loading || (!result && !error)}
                className="flex items-center gap-1"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}