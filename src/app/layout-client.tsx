"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { MySidebar } from "@/components/MySidebar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return <MySidebar>{children}</MySidebar>;
}
