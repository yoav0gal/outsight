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

  questionnaireTemplates: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    practitionerId: v.optional(v.id("users")), // System-wide if undefined
    source: v.optional(v.union(v.literal("system"), v.literal("practitioner"))),
    originTemplateId: v.optional(v.id("questionnaireTemplates")),
    tags: v.optional(v.array(v.string())),
    archivedAt: v.optional(v.number()),
    questions: v.array(
      v.object({
        id: v.string(), // Unique identifier for the question
        type: v.union(
          v.literal("short_text"),
          v.literal("long_text"),
          v.literal("multiple_choice"),
          v.literal("boolean"),
          v.literal("numeric_scale")
        ),
        prompt: v.string(),
        required: v.boolean(),
        options: v.optional(v.array(v.string())), // For multiple_choice
        scaleConfig: v.optional(
          v.object({
            min: v.number(),
            max: v.number(),
            minLabel: v.optional(v.string()),
            maxLabel: v.optional(v.string()),
          })
        ), // For numeric_scale
      })
    ),
  }).index("by_practitioner", ["practitionerId"]),

  clinicQuestionnaireTemplates: defineTable({
    practitionerId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    addedAt: v.number(),
  })
    .index("by_practitioner", ["practitionerId"])
    .index("by_practitioner_template", ["practitionerId", "templateId"]),

  questionnaireAssignments: defineTable({
    patientId: v.id("users"),
    practitionerId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    frequency: v.union(v.literal("once"), v.literal("daily"), v.literal("weekly")),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdAt: v.number(), // Date.now()
  })
    .index("by_patient", ["patientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_status", ["status"]),

  questionnaireInstances: defineTable({
    assignmentId: v.id("questionnaireAssignments"),
    patientId: v.id("users"),
    templateId: v.id("questionnaireTemplates"), // Denormalized for easier querying
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("expired")),
    answers: v.optional(
      v.array(
        v.object({
          questionId: v.string(),
          value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
        })
      )
    ),
    createdAt: v.number(), // Date.now()
    expiresAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
  })
    .index("by_patient", ["patientId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_status", ["status"]),

  questionnaireHistoryViews: defineTable({
    practitionerId: v.optional(v.id("users")),
    patientId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    lastViewedAt: v.number(),
  })
    .index("by_practitioner_patient", ["practitionerId", "patientId"])
    .index("by_practitioner_patient_template", ["practitionerId", "patientId", "templateId"]),

  sessionReviews: defineTable({
    patientId: v.id("users"),
    practitionerId: v.id("users"),
    sessionNumber: v.number(),
    sessionDate: v.number(),
    title: v.optional(v.string()),
    review: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_practitioner_patient", ["practitionerId", "patientId"]),
});
