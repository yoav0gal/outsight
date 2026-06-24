"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { AuthKitProvider, useAuth, useAccessToken } from "@workos-inc/authkit-nextjs/components";
import { usePathname } from "next/navigation";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => {
    return new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  });
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}

function useAuthFromAuthKit() {
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN !== "false";
  const { user: workosUser, loading: isWorkosLoading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();

  const user = isLoginEnabled ? workosUser : null;
  const isLoading = isLoginEnabled ? isWorkosLoading : false;

  const pathname = usePathname();
  const isPatientRoute = pathname.startsWith("/patient") || pathname.startsWith("/p/");
  const [patientStatus, setPatientStatus] = useState<"idle" | "loading" | "authenticated" | "unauthenticated">("idle");
  const patientTokenRef = useRef<string | null>(null);

  const refreshPatientToken = useCallback(async () => {
    const response = await fetch("/api/patient-auth/token", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      patientTokenRef.current = null;
      setPatientStatus("unauthenticated");
      return null;
    }

    const data = (await response.json()) as { token?: string };
    const nextToken = data.token ?? null;
    patientTokenRef.current = nextToken;
    setPatientStatus(nextToken ? "authenticated" : "unauthenticated");
    return nextToken;
  }, []);

  useEffect(() => {
    if (user && !isPatientRoute) {
      patientTokenRef.current = null;
      const timer = setTimeout(() => {
        setPatientStatus("unauthenticated");
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;

    void fetch("/api/patient-auth/token", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!isMounted) return;

        if (!response.ok) {
          patientTokenRef.current = null;
          setPatientStatus("unauthenticated");
          return;
        }

        const data = (await response.json()) as { token?: string };
        const nextToken = data.token ?? null;
        patientTokenRef.current = nextToken;
        setPatientStatus(nextToken ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!isMounted) return;
        patientTokenRef.current = null;
        setPatientStatus("unauthenticated");
      });

    return () => {
      isMounted = false;
    };
  }, [user, pathname, isPatientRoute]);

  const useWorkos = !!user && (!isPatientRoute || patientStatus !== "authenticated");

  const isAuthenticated = useWorkos || patientStatus === "authenticated";
  const combinedIsLoading =
    isLoading || (!useWorkos && (patientStatus === "idle" || patientStatus === "loading"));

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      if (useWorkos) {
        try {
          if (forceRefreshToken) {
            return (await refresh()) ?? null;
          }

          return (await getAccessToken()) ?? null;
        } catch (error) {
          console.error("Failed to get WorkOS access token:", error);
          return null;
        }
      }

      try {
        if (!forceRefreshToken && patientTokenRef.current) {
          return patientTokenRef.current;
        }

        return await refreshPatientToken();
      } catch (error) {
        console.error("Failed to get patient access token:", error);
        return null;
      }
    },
    [useWorkos, refresh, getAccessToken, refreshPatientToken],
  );

  return {
    isLoading: combinedIsLoading,
    isAuthenticated,
    fetchAccessToken,
  };
}
