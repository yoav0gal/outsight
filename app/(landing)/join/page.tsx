"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, loading: authLoading } = useAuth();

  const isValidToken = useQuery(api.invites.validate, token ? { token } : "skip");
  const error =
    !authLoading && isValidToken !== undefined && (!token || isValidToken === false)
      ? "This invitation link is invalid, expired, or has already been used."
      : null;

  useEffect(() => {
    if (authLoading || isValidToken === undefined) {
      return;
    }

    if (!token || isValidToken === false) {
      return;
    }

    if (isValidToken === true) {
      // Set cookie for the token (lasts 1 hour)
      document.cookie = `invitation_token=${token}; max-age=3600; path=/; sameSite=lax`;

      if (user) {
        router.push("/");
      } else {
        router.push("/sign-up");
      }
    }
  }, [user, authLoading, token, isValidToken, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-zinc-200 text-center max-w-md">
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Invalid Invitation</h2>
          <p className="text-zinc-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>}>
      <JoinContent />
    </Suspense>
  );
}
