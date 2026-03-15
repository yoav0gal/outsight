import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: { 
    name: v.optional(v.string()), 
    email: v.string(),
    invitationToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication identifier");
    }

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (user !== null) {
      // If user exists, we might want to update their name/email
      if (user.name !== args.name || user.email !== args.email) {
        await ctx.db.patch(user._id, { name: args.name, email: args.email });
      }
      return user._id;
    }

    // New user logic
    let role: "practitioner" | "patient" = "practitioner";
    let practitionerId: any = undefined;

    if (args.invitationToken) {
      const invitation = await ctx.db
        .query("invitations")
        .withIndex("by_token", (q) => q.eq("token", args.invitationToken!))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .unique();

      if (invitation) {
        role = "patient";
        practitionerId = invitation.practitionerId;
        // Mark invitation as accepted
        await ctx.db.patch(invitation._id, { status: "accepted" });
      }
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      tokenIdentifier: identity.subject,
      role,
      practitionerId,
    });
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

    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("practitionerId"), user._id))
      .collect();
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
