import { NextResponse } from "next/server";

import { getPatientAuthJwksResponse } from "@/lib/patientAuth/server";

export async function GET() {
  return NextResponse.json(getPatientAuthJwksResponse());
}
