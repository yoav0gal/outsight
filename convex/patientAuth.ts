import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const PATIENT_REFRESH_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function getPatientAuthApiSecret() {
  const secret = process.env.PATIENT_AUTH_API_SECRET;
  if (!secret) {
    throw new Error("Missing PATIENT_AUTH_API_SECRET");
  }

  return secret;
}

function assertApiSecret(providedSecret: string) {
  if (providedSecret !== getPatientAuthApiSecret()) {
    throw new Error("Unauthorized");
  }
}

function getInvitationExpiry(invitation: { _creationTime: number; expiresAt?: number }) {
  return invitation.expiresAt ?? invitation._creationTime + INVITE_TTL_MS;
}

function isExpiredInvitation(invitation: { _creationTime: number; expiresAt?: number }) {
  return getInvitationExpiry(invitation) <= Date.now();
}

export const registerPatientFromInvite = mutation({
  args: {
    apiSecret: v.string(),
    token: v.string(),
    username: v.string(),
    usernameNormalized: v.string(),
    passwordHash: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.apiSecret);

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (
      !invitation ||
      invitation.status !== "pending" ||
      (invitation.mode && invitation.mode !== "patient_credentials") ||
      isExpiredInvitation(invitation)
    ) {
      throw new Error("Invitation not available");
    }

    const existingCredential = await ctx.db
      .query("patientCredentials")
      .withIndex("by_username", (q) => q.eq("usernameNormalized", args.usernameNormalized))
      .unique();

    if (existingCredential) {
      throw new Error("Username already in use");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: invitation.patientName,
      accountName: undefined,
      email: undefined,
      tokenIdentifier: args.tokenIdentifier,
      role: "patient",
      practitionerId: invitation.practitionerId,
      authType: "patient_credentials",
      loginIdentifier: args.username,
      loginIdentifierNormalized: args.usernameNormalized,
    });

    await ctx.db.insert("patientCredentials", {
      userId,
      username: args.username,
      usernameNormalized: args.usernameNormalized,
      passwordHash: args.passwordHash,
      passwordVersion: 1,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      acceptedUserId: userId,
    });

    return {
      userId,
      tokenIdentifier: args.tokenIdentifier,
      loginIdentifier: args.username,
      name: invitation.patientName,
      accountName: undefined,
    };
  },
});

export const getPatientLoginAccount = query({
  args: {
    apiSecret: v.string(),
    usernameNormalized: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.apiSecret);

    const credential = await ctx.db
      .query("patientCredentials")
      .withIndex("by_username", (q) => q.eq("usernameNormalized", args.usernameNormalized))
      .unique();

    if (!credential || credential.disabledAt) {
      return null;
    }

    const user = await ctx.db.get(credential.userId);
    if (!user || user.authType !== "patient_credentials") {
      return null;
    }

    return {
      userId: user._id,
      tokenIdentifier: user.tokenIdentifier,
      loginIdentifier: user.loginIdentifier,
      name: user.name,
      accountName: user.accountName,
      passwordHash: credential.passwordHash,
      disabledAt: credential.disabledAt,
    };
  },
});

export const createPatientSession = mutation({
  args: {
    apiSecret: v.string(),
    userId: v.id("users"),
    refreshTokenHash: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.apiSecret);

    const user = await ctx.db.get(args.userId);
    if (!user || user.authType !== "patient_credentials" || user.role !== "patient") {
      throw new Error("Patient account not found");
    }

    const now = Date.now();
    const sessionId = crypto.randomUUID();

    await ctx.db.insert("patientSessions", {
      userId: args.userId,
      sessionId,
      refreshTokenHash: args.refreshTokenHash,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
      expiresAt: now + PATIENT_REFRESH_SESSION_TTL_MS,
      userAgent: args.userAgent,
    });

    const credential = await ctx.db
      .query("patientCredentials")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (credential) {
      await ctx.db.patch(credential._id, {
        lastLoginAt: now,
        updatedAt: now,
      });
    }

    return {
      sessionId,
      expiresAt: now + PATIENT_REFRESH_SESSION_TTL_MS,
      tokenIdentifier: user.tokenIdentifier,
    };
  },
});

export const getPatientSessionForRefreshToken = query({
  args: {
    apiSecret: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.apiSecret);

    const session = await ctx.db
      .query("patientSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.authType !== "patient_credentials" || user.role !== "patient") {
      return null;
    }

    return {
      userId: user._id,
      tokenIdentifier: user.tokenIdentifier,
      loginIdentifier: user.loginIdentifier,
      name: user.name,
      accountName: user.accountName,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    };
  },
});

export const touchPatientSession = mutation({
  args: {
    apiSecret: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.apiSecret);

    const session = await ctx.db
      .query("patientSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.revokedAt) {
      return null;
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      lastSeenAt: now,
      updatedAt: now,
    });

    return null;
  },
});

export const revokePatientSession = mutation({
  args: {
    apiSecret: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertApiSecret(args.apiSecret);

    const session = await ctx.db
      .query("patientSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.revokedAt) {
      return null;
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      revokedAt: now,
      updatedAt: now,
    });

    return null;
  },
});
