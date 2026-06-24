import { NextResponse } from "next/server";

import {
  createOpaqueToken,
  hashRefreshToken,
  revokeCurrentPatientSession,
  setPatientRefreshCookie,
} from "@/lib/patientAuth/server";
import { createPatientSession } from "@/lib/patientAuth/convex";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getPatientAuthApiSecret } from "@/lib/patientAuth/config";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  return url;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
    };

    if (!body.token) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }

    const client = new ConvexHttpClient(getConvexUrl());
    const loginResult = await client.mutation(api.patientAuth.loginPatientLinkOnly, {
      apiSecret: getPatientAuthApiSecret(),
      token: body.token,
    });

    const refreshToken = createOpaqueToken();
    const session = await createPatientSession({
      userId: loginResult.userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    await revokeCurrentPatientSession();
    await setPatientRefreshCookie(session.sessionId, refreshToken);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to log in link-only patient", error);
    return NextResponse.json({ code: "login_failed" }, { status: 500 });
  }
}
