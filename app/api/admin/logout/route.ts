import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE_NAME,
  getClearedAdminSessionCookieOptions,
} from "@/lib/admin/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", getClearedAdminSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
