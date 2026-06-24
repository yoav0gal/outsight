import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

const MAX_TITLE_LENGTH = 120;
const MAX_REVIEW_LENGTH = 10_000;
const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}

async function getOwnedPatient(
  ctx: QueryCtx | MutationCtx,
  practitionerId: Id<"users">,
  patientId: Id<"users">
) {
  const patient = await ctx.db.get(patientId);

  if (!patient || patient.role !== "patient" || patient.practitionerId !== practitionerId) {
    throw new Error("Patient not found or unauthorized");
  }

  return patient;
}

function normalizeTitle(title?: string) {
  const trimmed = title?.trim();

  if (!trimmed) return undefined;
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error("Title is too long");
  }

  return trimmed;
}

function normalizeReview(review: string) {
  const trimmed = review.trim();

  if (!trimmed) {
    throw new Error("Review is required");
  }

  if (trimmed.length > MAX_REVIEW_LENGTH) {
    throw new Error("Review is too long");
  }

  return trimmed;
}

function normalizeSessionDate(sessionDate: number) {
  if (!Number.isFinite(sessionDate)) {
    throw new Error("Invalid session date");
  }

  const now = Date.now();
  if (sessionDate > now + MAX_FUTURE_MS) {
    throw new Error("Invalid session date");
  }

  return sessionDate;
}

export const listPatientSessionReviews = query({
  args: { patientId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") {
      return { reviews: [], totalSessions: 0, latestSessionDate: null, latestSessionNumber: null };
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.role !== "patient" || patient.practitionerId !== user._id) {
      return { reviews: [], totalSessions: 0, latestSessionDate: null, latestSessionNumber: null };
    }

    const reviews = await ctx.db
      .query("sessionReviews")
      .withIndex("by_practitioner_patient", (q) =>
        q.eq("practitionerId", user._id).eq("patientId", args.patientId)
      )
      .collect();

    reviews.sort((a, b) => {
      if (b.sessionDate !== a.sessionDate) {
        return b.sessionDate - a.sessionDate;
      }

      return b.createdAt - a.createdAt;
    });

    return {
      reviews,
      totalSessions: reviews.length,
      latestSessionDate: reviews[0]?.sessionDate ?? null,
      latestSessionNumber: reviews.reduce((max, review) => Math.max(max, review.sessionNumber), 0) || null,
    };
  },
});

export const createSessionReview = mutation({
  args: {
    patientId: v.id("users"),
    sessionDate: v.number(),
    title: v.optional(v.string()),
    review: v.string(),
  },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    await getOwnedPatient(ctx, practitioner._id, args.patientId);

    const existingReviews = await ctx.db
      .query("sessionReviews")
      .withIndex("by_practitioner_patient", (q) =>
        q.eq("practitionerId", practitioner._id).eq("patientId", args.patientId)
      )
      .collect();

    const sessionNumber = existingReviews.length + 1;
    const now = Date.now();

    return await ctx.db.insert("sessionReviews", {
      patientId: args.patientId,
      practitionerId: practitioner._id,
      sessionNumber,
      sessionDate: normalizeSessionDate(args.sessionDate),
      title: normalizeTitle(args.title),
      review: normalizeReview(args.review),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSessionReview = mutation({
  args: {
    reviewId: v.id("sessionReviews"),
    sessionDate: v.number(),
    title: v.optional(v.string()),
    review: v.string(),
  },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const existingReview = await ctx.db.get(args.reviewId);
    if (!existingReview || existingReview.practitionerId !== practitioner._id) {
      throw new Error("Session review not found or unauthorized");
    }

    await getOwnedPatient(ctx, practitioner._id, existingReview.patientId);

    await ctx.db.patch(args.reviewId, {
      sessionDate: normalizeSessionDate(args.sessionDate),
      title: normalizeTitle(args.title),
      review: normalizeReview(args.review),
      updatedAt: Date.now(),
    });
  },
});
