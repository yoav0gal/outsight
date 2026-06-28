"use client";

import { useEffect, useState } from "react";

interface ClientDateTimeProps {
  date: Date | string | number;
  mode?: "toLocaleString" | "toLocaleDateString";
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
}

export function ClientDateTime({
  date,
  mode = "toLocaleString",
  options,
  fallback = "",
}: ClientDateTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) {
        setMounted(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!mounted) {
    return <span suppressHydrationWarning>{fallback}</span>;
  }

  let formatted = fallback;
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      formatted =
        mode === "toLocaleDateString"
          ? d.toLocaleDateString(undefined, options)
          : d.toLocaleString(undefined, options);
    }
  } catch (error) {
    console.error("ClientDateTime formatting error:", error);
  }

  return <span suppressHydrationWarning>{formatted}</span>;
}
