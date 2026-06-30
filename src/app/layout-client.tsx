"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { MySidebar } from "@/components/MySidebar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // On server or before hydration, return null or a simple loading state
  if (!mounted) {
    return null; // or return <div className="min-h-screen" />;
  }

  if (loading) {
    return <Loader />;
  }

  return <MySidebar>{children}</MySidebar>;
}