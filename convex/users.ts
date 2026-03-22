import { mutation, query, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function getInvitationExpiry(invitation: { _creationTime: number; expiresAt?: number }) {
  return invitation.expiresAt ?? invitation._creationTime + INVITE_TTL_MS;
}

function isExpiredInvitation(invitation: { _creationTime: number; expiresAt?: number }) {
  return getInvitationExpiry(invitation) <= Date.now();
}

async function getPendingWorkosInvitation(ctx: QueryCtx, invitationToken: string) {
  const invitation = await ctx.db
    .query("invitations")
    .withIndex("by_token", (q) => q.eq("token", invitationToken))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .unique();

  if (
    !invitation ||
    (invitation.mode ?? "workos") !== "workos" ||
    isExpiredInvitation(invitation)
  ) {
    throw new Error("Invalid or already used invitation token.");
  }

  return invitation;
}

function getInstanceHistoryTimestamp(instance: {
  submittedAt?: number;
  expiresAt?: number;
  createdAt: number;
}) {
  return instance.submittedAt ?? instance.expiresAt ?? instance.createdAt;
}

function isHistoryInstance<T extends { status: "pending" | "completed" | "expired" }>(
  instance: T
): instance is T & { status: "completed" | "expired" } {
  return instance.status !== "pending";
}

export const store = mutation({
  args: { 
    accountName: v.optional(v.string()),
    email: v.optional(v.string()),
    invitationToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication identifier");
    }

    const pendingInvitation = args.invitationToken
      ? await getPendingWorkosInvitation(ctx, args.invitationToken)
      : null;

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (user !== null) {
      if (pendingInvitation) {
        if (user.authType !== "workos" || user.role !== "patient") {
          throw new Error("Only existing patient accounts can accept this invitation.");
        }

        if (
          user.practitionerId &&
          user.practitionerId !== pendingInvitation.practitionerId
        ) {
          throw new Error("This patient account is already linked to another practitioner.");
        }

        await ctx.db.patch(user._id, {
          name: pendingInvitation.patientName ?? user.name,
          accountName: args.accountName,
          email: args.email,
          practitionerId: pendingInvitation.practitionerId,
          loginIdentifier: args.email,
          loginIdentifierNormalized: args.email?.toLocaleLowerCase(),
        });

        await ctx.db.patch(pendingInvitation._id, {
          status: "accepted",
          acceptedAt: Date.now(),
          acceptedUserId: user._id,
        });

        return user._id;
      }

      if (user.role === "patient" && user.authType === "workos") {
        const nextLoginIdentifier = args.email;
        const nextLoginIdentifierNormalized = args.email?.toLocaleLowerCase();

        if (
          user.accountName !== args.accountName ||
          user.email !== args.email ||
          user.loginIdentifier !== nextLoginIdentifier ||
          user.loginIdentifierNormalized !== nextLoginIdentifierNormalized
        ) {
          await ctx.db.patch(user._id, {
            accountName: args.accountName,
            email: args.email,
            loginIdentifier: nextLoginIdentifier,
            loginIdentifierNormalized: nextLoginIdentifierNormalized,
          });
        }

        return user._id;
      }

      if (user.name !== args.accountName || user.email !== args.email) {
        await ctx.db.patch(user._id, { name: args.accountName, email: args.email });
      }
      return user._id;
    }

    // New user logic
    let role: "practitioner" | "patient" = "practitioner";
    let practitionerId: Id<"users"> | undefined;
    let clinicName = args.accountName;
    let acceptedInvitationId: Id<"invitations"> | undefined;

    if (pendingInvitation) {
      role = "patient";
      practitionerId = pendingInvitation.practitionerId;
      clinicName = pendingInvitation.patientName;
      acceptedInvitationId = pendingInvitation._id;
    }

    const userId = await ctx.db.insert("users", {
      name: clinicName,
      accountName: role === "patient" ? args.accountName : undefined,
      email: args.email,
      tokenIdentifier: identity.subject,
      role,
      practitionerId,
      authType: "workos",
      loginIdentifier: args.email,
      loginIdentifierNormalized: args.email?.toLocaleLowerCase(),
    });

    if (acceptedInvitationId) {
      await ctx.db.patch(acceptedInvitationId, {
        status: "accepted",
        acceptedAt: Date.now(),
        acceptedUserId: userId,
      });
    }

    return userId;
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
  },
});

export const listPatients = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const patients = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("practitionerId"), user._id))
      .collect();

    return await Promise.all(
      patients.map(async (patient) => {
        const [instances, viewRows] = await Promise.all([
          ctx.db
            .query("questionnaireInstances")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .collect(),
          ctx.db
            .query("questionnaireHistoryViews")
            .withIndex("by_practitioner_patient", (q) =>
              q.eq("practitionerId", user._id).eq("patientId", patient._id)
            )
            .collect(),
        ]);

        const lastViewedAtByTemplateId = new Map(
          viewRows.map((row) => [row.templateId, row.lastViewedAt] as const)
        );

        const unreadEntries = instances
          .filter(isHistoryInstance)
          .reduce((count, instance) => {
            const lastViewedAt = lastViewedAtByTemplateId.get(instance.templateId) ?? 0;
            return getInstanceHistoryTimestamp(instance) > lastViewedAt ? count + 1 : count;
          }, 0);

        return {
          ...patient,
          unreadEntries,
        };
      })
    );
  },
});

export const getPatient = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const patient = await ctx.db.get(args.id);
    if (!patient || patient.role !== "patient" || patient.practitionerId !== user._id) {
      throw new Error("Patient not found or unauthorized");
    }

    return patient;
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
