import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx } from "./_generated/server";

export const create = mutation({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") {
      throw new Error("Only practitioners can create invitations");
    }

    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    await ctx.db.insert("invitations", {
      token,
      practitionerId: user._id,
      email: args.email,
      status: "pending",
    });

    return token;
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
