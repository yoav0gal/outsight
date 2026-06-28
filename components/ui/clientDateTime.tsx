"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

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
  const locale = useLocale();

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
      const formatLocale = locale === "he" ? "he-IL" : undefined;
      formatted =
        mode === "toLocaleDateString"
          ? d.toLocaleDateString(formatLocale, options)
          : d.toLocaleString(formatLocale, options);
    }
  } catch (error) {
    console.error("ClientDateTime formatting error:", error);
  }

  return <span suppressHydrationWarning>{formatted}</span>;
}
