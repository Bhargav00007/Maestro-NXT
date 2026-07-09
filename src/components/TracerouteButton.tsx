"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Copy, Check, X, Loader2, AlertTriangle } from "lucide-react";

interface TracerouteButtonProps {
  ip: string;
  hostId?: string;
}

export default function TracerouteButton({ ip, hostId }: TracerouteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTraceroute = async () => {
    setOpen(true);
    setLoading(true);
    setResult("");
    setWarning(null);
    setCopied(false);

    try {
      const url = `/api/traceroute?host=${encodeURIComponent(ip)}&hostId=${encodeURIComponent(hostId || "")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setResult(data.output || "No output");
        if (data.warning) {
          setWarning(data.warning);
        }
      } else {
        setResult(data.error || "Traceroute failed");
      }
    } catch (err: any) {
      setResult(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    const text = result || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleTraceroute} className="flex items-center gap-1">
        <Activity className="h-4 w-4" />
        Traceroute
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
                <Activity className="h-5 w-5" />
                Traceroute to {ip}
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
                  <span className="ml-2">Tracing route...</span>
                </div>
              ) : (
                <>
                  <pre className="bg-muted/30 p-4 rounded-md text-sm font-mono whitespace-pre-wrap break-words max-h-60 overflow-auto">
                    {result || "No output"}
                  </pre>
                  {warning && (
                    <div className="mt-2 flex items-center gap-2 text-yellow-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{warning}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
                disabled={loading || !result}
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