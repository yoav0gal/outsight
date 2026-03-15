"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, loading } = useAuth();

  useEffect(() => {
    if (token) {
      // Set cookie for the token (lasts 1 hour)
      document.cookie = `invitation_token=${token}; max-age=3600; path=/; sameSite=lax`;
    }

    if (!loading) {
      if (user) {
        router.push("/");
      } else {
        router.push("/sign-up");
      }
    }
  }, [user, loading, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );
}
