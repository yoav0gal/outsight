import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    tokenIdentifier: v.string(), // WorkOS user ID or subject
    role: v.union(v.literal("practitioner"), v.literal("patient")),
    practitionerId: v.optional(v.id("users")), // Only for patients
  }).index("by_token", ["tokenIdentifier"]),

  invitations: defineTable({
    token: v.string(),
    practitionerId: v.id("users"),
    email: v.optional(v.string()), // Optional: target email
    status: v.union(v.literal("pending"), v.literal("accepted")),
  }).index("by_token", ["token"]),
});
