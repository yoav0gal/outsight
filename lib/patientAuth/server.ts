import "server-only";

import { hash as hashPasswordWithArgon2, verify as verifyArgon2 } from "@node-rs/argon2";
import { createHash, randomBytes } from "crypto";
import { importPKCS8, type JWTPayload, SignJWT } from "jose";
import { cookies } from "next/headers";

import {
  getPatientAuthAudience,
  getPatientAuthIssuer,
  getPatientAuthJwks,
  getPatientAuthKeyId,
  getPatientAuthPrivateKeyPem,
} from "@/lib/patientAuth/config";
export { isValidPassword } from "@/lib/patientAuth/password";
import {
  getPatientSessionForRefreshToken,
  revokePatientSession,
  touchPatientSession,
} from "@/lib/patientAuth/convex";

export const PATIENT_REFRESH_COOKIE_NAME = "patient_refresh";
export const PATIENT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const PATIENT_REFRESH_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface PatientSessionUser {
  userId: string;
  tokenIdentifier: string;
  role: "patient";
  authType: "patient_credentials";
  name?: string;
  accountName?: string;
  loginIdentifier?: string;
}

interface ParsedRefreshCookie {
  sessionId: string;
  refreshToken: string;
}

function getRefreshCookieExpiry() {
  return new Date(Date.now() + PATIENT_REFRESH_SESSION_TTL_MS);
}

export function getPatientRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: getRefreshCookieExpiry(),
  };
}

export function getClearedPatientRefreshCookieOptions() {
  return {
    ...getPatientRefreshCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  };
}

export async function hashPatientPassword(password: string) {
  return hashPasswordWithArgon2(password, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPatientPassword(password: string, hash: string) {
  return verifyArgon2(hash, password);
}

export function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase();
}

export function isValidUsername(username: string) {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

export function createPatientTokenIdentifier() {
  return `patient:${crypto.randomUUID()}`;
}

export function createOpaqueToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function hashRefreshToken(refreshToken: string) {
  return createHash("sha256").update(refreshToken).digest("hex");
}

export function buildPatientRefreshCookieValue(sessionId: string, refreshToken: string) {
  return `${sessionId}.${refreshToken}`;
}

export function parsePatientRefreshCookieValue(value: string | undefined): ParsedRefreshCookie | null {
  if (!value) return null;

  const [sessionId, refreshToken] = value.split(".");
  if (!sessionId || !refreshToken) return null;

  return { sessionId, refreshToken };
}

async function getPatientSigningKey() {
  return importPKCS8(getPatientAuthPrivateKeyPem(), "RS256");
}

export async function createPatientAccessToken(subject: string) {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({
    role: "patient",
    authType: "patient_credentials",
  } satisfies JWTPayload)
    .setProtectedHeader({
      alg: "RS256",
      kid: getPatientAuthKeyId(),
      typ: "JWT",
    })
    .setIssuer(getPatientAuthIssuer())
    .setAudience(getPatientAuthAudience())
    .setSubject(subject)
    .setIssuedAt(nowInSeconds)
    .setExpirationTime(nowInSeconds + Math.floor(PATIENT_ACCESS_TOKEN_TTL_MS / 1000))
    .sign(await getPatientSigningKey());
}

export function getPatientAuthJwksResponse() {
  return getPatientAuthJwks();
}

export async function setPatientRefreshCookie(sessionId: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    PATIENT_REFRESH_COOKIE_NAME,
    buildPatientRefreshCookieValue(sessionId, refreshToken),
    getPatientRefreshCookieOptions(),
  );
}

export async function clearPatientRefreshCookie() {
  const cookieStore = await cookies();
  cookieStore.set(PATIENT_REFRESH_COOKIE_NAME, "", getClearedPatientRefreshCookieOptions());
}

export async function getPatientSessionFromCookie(): Promise<PatientSessionUser | null> {
  const cookieStore = await cookies();
  const parsed = parsePatientRefreshCookieValue(cookieStore.get(PATIENT_REFRESH_COOKIE_NAME)?.value);

  if (!parsed) {
    return null;
  }

  const session = await getPatientSessionForRefreshToken(parsed.sessionId);
  if (!session) {
    return null;
  }

  if (session.revokedAt || session.expiresAt <= Date.now()) {
    return null;
  }

  if (session.refreshTokenHash !== hashRefreshToken(parsed.refreshToken)) {
    return null;
  }

  await touchPatientSession(parsed.sessionId);

  return {
    userId: session.userId,
    tokenIdentifier: session.tokenIdentifier,
    role: "patient",
    authType: "patient_credentials",
    name: session.name,
    accountName: session.accountName,
    loginIdentifier: session.loginIdentifier,
  };
}

export async function revokeCurrentPatientSession() {
  const cookieStore = await cookies();
  const parsed = parsePatientRefreshCookieValue(cookieStore.get(PATIENT_REFRESH_COOKIE_NAME)?.value);

  if (parsed) {
    await revokePatientSession(parsed.sessionId);
  }

  await clearPatientRefreshCookie();
}
