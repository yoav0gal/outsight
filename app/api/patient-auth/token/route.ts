import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createPatientAccessToken, getPatientSessionFromCookie } from "@/lib/patientAuth/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_ENABLE_LOGIN === "false") {
    const cookieStore = await cookies();
    const devUserTokenIdentifier = cookieStore.get("outsight_dev_user_token_identifier")?.value;
    if (devUserTokenIdentifier) {
      const token = await createPatientAccessToken(devUserTokenIdentifier);
      return NextResponse.json({ token });
    }
  }

  const session = await getPatientSessionFromCookie();
  if (!session) {
    return NextResponse.json({ code: "no_session" }, { status: 401 });
  }

  const token = await createPatientAccessToken(session.tokenIdentifier, session.authType);
  return NextResponse.json({ token });
}

