import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";

const ADMIN_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

interface AdminSessionPayload {
  expiresAt: number;
}

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_DASHBOARD_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_DASHBOARD_SESSION_SECRET");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(payload).digest("base64url");
}

function isValidSignature(payload: string, signature: string) {
  const expectedSignature = signPayload(payload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function createAdminSessionCookieValue() {
  const payload: AdminSessionPayload = {
    expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(Date.now() + ADMIN_SESSION_DURATION_MS),
  };
}

export function getClearedAdminSessionCookieOptions() {
  return {
    ...getAdminSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  };
}

export function verifyAdminSessionCookieValue(value: string | undefined) {
  if (!value) return false;

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return false;
  if (!isValidSignature(encodedPayload, signature)) return false;

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AdminSessionPayload;
    return typeof payload.expiresAt === "number" && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function hasValidAdminSession() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") || "";
  const headerValue = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${ADMIN_SESSION_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_SESSION_COOKIE_NAME}=`.length);

  return verifyAdminSessionCookieValue(
    cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value ?? headerValue
  );
}
