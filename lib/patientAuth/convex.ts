import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getPatientAuthApiSecret } from "@/lib/patientAuth/config";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  return url;
}

function getConvexHttpClient() {
  return new ConvexHttpClient(getConvexUrl());
}

export function getRegistrationInvite(token: string) {
  const client = getConvexHttpClient();
  return client.query(api.invites.getRegistrationInvite, { token });
}

export function registerPatientFromInvite(args: {
  token: string;
  username: string;
  usernameNormalized: string;
  passwordHash: string;
  tokenIdentifier: string;
}) {
  const client = getConvexHttpClient();
  return client.mutation(api.patientAuth.registerPatientFromInvite, {
    apiSecret: getPatientAuthApiSecret(),
    ...args,
  });
}

export function getPatientLoginAccount(usernameNormalized: string) {
  const client = getConvexHttpClient();
  return client.query(api.patientAuth.getPatientLoginAccount, {
    apiSecret: getPatientAuthApiSecret(),
    usernameNormalized,
  });
}

export function createPatientSession(args: {
  userId: Id<"users">;
  refreshTokenHash: string;
  userAgent?: string;
}) {
  const client = getConvexHttpClient();
  return client.mutation(api.patientAuth.createPatientSession, {
    apiSecret: getPatientAuthApiSecret(),
    ...args,
  });
}

export function getPatientSessionForRefreshToken(sessionId: string) {
  const client = getConvexHttpClient();
  return client.query(api.patientAuth.getPatientSessionForRefreshToken, {
    apiSecret: getPatientAuthApiSecret(),
    sessionId,
  });
}

export function touchPatientSession(sessionId: string) {
  const client = getConvexHttpClient();
  return client.mutation(api.patientAuth.touchPatientSession, {
    apiSecret: getPatientAuthApiSecret(),
    sessionId,
  });
}

export function revokePatientSession(sessionId: string) {
  const client = getConvexHttpClient();
  return client.mutation(api.patientAuth.revokePatientSession, {
    apiSecret: getPatientAuthApiSecret(),
    sessionId,
  });
}
