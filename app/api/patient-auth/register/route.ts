import { NextResponse } from "next/server";

import {
  createOpaqueToken,
  createPatientTokenIdentifier,
  hashPatientPassword,
  hashRefreshToken,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  revokeCurrentPatientSession,
  setPatientRefreshCookie,
} from "@/lib/patientAuth/server";
import { createPatientSession, registerPatientFromInvite } from "@/lib/patientAuth/convex";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      username?: string;
      password?: string;
    };

    if (!body.token || !body.username || !body.password) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }

    const username = body.username.trim();
    const usernameNormalized = normalizeUsername(username);

    if (!isValidUsername(usernameNormalized)) {
      return NextResponse.json({ code: "invalid_username" }, { status: 400 });
    }

    if (!isValidPassword(body.password)) {
      return NextResponse.json({ code: "invalid_password" }, { status: 400 });
    }

    const passwordHash = await hashPatientPassword(body.password);
    const registration = await registerPatientFromInvite({
      token: body.token,
      username,
      usernameNormalized,
      passwordHash,
      tokenIdentifier: createPatientTokenIdentifier(),
    });

    const refreshToken = createOpaqueToken();
    const session = await createPatientSession({
      userId: registration.userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    await revokeCurrentPatientSession();
    await setPatientRefreshCookie(session.sessionId, refreshToken);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Username already in use") {
        return NextResponse.json({ code: "username_taken" }, { status: 409 });
      }

      if (error.message === "Invitation not available") {
        return NextResponse.json({ code: "invalid_invite" }, { status: 400 });
      }
    }

    console.error("Failed to register patient credentials", error);
    return NextResponse.json({ code: "registration_failed" }, { status: 500 });
  }
}
