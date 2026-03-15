"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export default function PatientLayout({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.viewer);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "patient") {
      router.push("/practitioner/dashboard");
    }
  }, [user, router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user.role !== "patient") return null;

  return <>{children}</>;
}
