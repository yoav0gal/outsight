import { NextResponse } from "next/server";

import { createPatientSession, getPatientLoginAccount } from "@/lib/patientAuth/convex";
import {
  createOpaqueToken,
  hashRefreshToken,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  revokeCurrentPatientSession,
  setPatientRefreshCookie,
  verifyPatientPassword,
} from "@/lib/patientAuth/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!body.username || !body.password) {
      return NextResponse.json({ code: "invalid_credentials" }, { status: 400 });
    }

    const usernameNormalized = normalizeUsername(body.username);
    if (!isValidUsername(usernameNormalized) || !isValidPassword(body.password)) {
      return NextResponse.json({ code: "invalid_credentials" }, { status: 401 });
    }

    const account = await getPatientLoginAccount(usernameNormalized);
    if (!account) {
      return NextResponse.json({ code: "invalid_credentials" }, { status: 401 });
    }

    const isValid = await verifyPatientPassword(body.password, account.passwordHash);
    if (!isValid) {
      return NextResponse.json({ code: "invalid_credentials" }, { status: 401 });
    }

    const refreshToken = createOpaqueToken();
    const session = await createPatientSession({
      userId: account.userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    await revokeCurrentPatientSession();
    await setPatientRefreshCookie(session.sessionId, refreshToken);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to log in patient", error);
    return NextResponse.json({ code: "login_failed" }, { status: 500 });
  }
}
