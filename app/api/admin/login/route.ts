import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookieValue,
  getAdminSessionCookieOptions,
} from "@/lib/admin/session";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ code: "invalid_password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionCookieValue(),
    getAdminSessionCookieOptions()
  );

  return NextResponse.json({ ok: true });
}
