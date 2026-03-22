import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx } from "./_generated/server";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function getInvitationExpiry(invitation: { _creationTime: number; expiresAt?: number }) {
  return invitation.expiresAt ?? invitation._creationTime + INVITE_TTL_MS;
}

function isExpiredInvitation(invitation: { _creationTime: number; expiresAt?: number }) {
  return getInvitationExpiry(invitation) <= Date.now();
}

export const validate = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation || invitation.status !== "pending" || isExpiredInvitation(invitation)) {
      return false;
    }
    return true;
  },
});

export const getRegistrationInvite = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (
      !invitation ||
      invitation.status !== "pending" ||
      isExpiredInvitation(invitation)
    ) {
      return null;
    }

    const practitioner = await ctx.db.get(invitation.practitionerId);

    return {
      mode: invitation.mode ?? "workos",
      patientName: invitation.patientName,
      practitionerName: practitioner?.name,
      expiresAt: getInvitationExpiry(invitation),
    };
  },
});

export const create = mutation({
  args: {
    patientName: v.string(),
    mode: v.union(v.literal("workos"), v.literal("patient_credentials")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") {
      throw new Error("Only practitioners can create invitations");
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = Date.now() + INVITE_TTL_MS;

    await ctx.db.insert("invitations", {
      token,
      practitionerId: user._id,
      patientName: args.patientName.trim(),
      mode: args.mode,
      status: "pending",
      expiresAt,
    });

    return {
      token,
      expiresAt,
      mode: args.mode,
      patientName: args.patientName.trim(),
    };
  },
});

async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}
