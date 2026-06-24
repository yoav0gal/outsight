import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getPatientAuthApiSecret } from "@/lib/patientAuth/config";
import {
  createOpaqueToken,
  hashRefreshToken,
  revokeCurrentPatientSession,
  setPatientRefreshCookie,
} from "@/lib/patientAuth/server";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.redirect(new URL("/anonymous/sign-in", request.url));
    }

    const client = new ConvexHttpClient(getConvexUrl());
    const loginResult = await client.mutation(api.patientAuth.loginPatientPrivateLink, {
      apiSecret: getPatientAuthApiSecret(),
      token: token,
    });

    const refreshToken = createOpaqueToken();
    const session = await client.mutation(api.patientAuth.createPatientSession, {
      apiSecret: getPatientAuthApiSecret(),
      userId: loginResult.userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: request.headers.get("user-agent") ?? undefined,
      authType: "link_only",
    });

    await revokeCurrentPatientSession();
    await setPatientRefreshCookie(session.sessionId, refreshToken);

    return NextResponse.redirect(new URL("/patient/home", request.url));
  } catch (error) {
    console.error("Failed to log in private link patient", error);
    return NextResponse.redirect(new URL("/anonymous/sign-in", request.url));
  }
}
