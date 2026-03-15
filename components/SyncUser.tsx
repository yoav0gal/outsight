"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

export function SyncUser() {
  const { user, loading } = useAuth();
  const storeUser = useMutation(api.users.store);
  const router = useRouter();
  
  const userData = useQuery(api.users.viewer);

  useEffect(() => {
    if (user && !loading) {
      // Check for invitation token in cookies
      const invitationToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("invitation_token="))
        ?.split("=")[1];

      storeUser({ 
        name: user.firstName ? `${user.firstName} ${user.lastName || ""}` : undefined,
        email: user.email,
        invitationToken: invitationToken || undefined
      }).then(() => {
        // Clear the cookie after sync
        if (invitationToken) {
          document.cookie = "invitation_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      });
    }
  }, [user, loading, storeUser]);

  useEffect(() => {
    if (userData) {
      if (userData.role === "practitioner") {
        router.push("/practitioner/dashboard");
      } else if (userData.role === "patient") {
        router.push("/patient/home");
      }
    }
  }, [userData, router]);

  return null;
}
