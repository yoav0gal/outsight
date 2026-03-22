import { NextResponse } from "next/server";

import { createPatientAccessToken, getPatientSessionFromCookie } from "@/lib/patientAuth/server";

export async function GET() {
  const session = await getPatientSessionFromCookie();
  if (!session) {
    return NextResponse.json({ code: "no_session" }, { status: 401 });
  }

  const token = await createPatientAccessToken(session.tokenIdentifier);
  return NextResponse.json({ token });
}
