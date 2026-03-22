import { NextResponse } from "next/server";

import { revokeCurrentPatientSession } from "@/lib/patientAuth/server";

export async function POST() {
  await revokeCurrentPatientSession();
  return NextResponse.json({ status: "ok" });
}
