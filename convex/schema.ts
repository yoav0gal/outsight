import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const scoringValidator = v.object({
  mode: v.literal("standard"),
  includedQuestionIds: v.array(v.string()),
  answerScores: v.optional(v.record(v.string(), v.record(v.string(), v.number()))),
});

const localizedTextValidator = v.object({
  en: v.optional(v.string()),
  he: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    accountName: v.optional(v.string()),
    email: v.optional(v.string()),
    tokenIdentifier: v.string(), // WorkOS user ID or subject
    role: v.union(v.literal("practitioner"), v.literal("patient")),
    practitionerId: v.optional(v.id("users")), // Only for patients
    authType: v.optional(v.union(v.literal("workos"), v.literal("patient_credentials"))),
    loginIdentifier: v.optional(v.string()),
    loginIdentifierNormalized: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_login_identifier", ["loginIdentifierNormalized"]),

  invitations: defineTable({
    token: v.string(),
    practitionerId: v.id("users"),
    email: v.optional(v.string()), // Legacy field for older invites
    patientName: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("workos"), v.literal("patient_credentials"))),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked")),
    expiresAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    acceptedUserId: v.optional(v.id("users")),
  }).index("by_token", ["token"]),

  patientCredentials: defineTable({
    userId: v.id("users"),
    username: v.string(),
    usernameNormalized: v.string(),
    passwordHash: v.string(),
    passwordVersion: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    disabledAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_username", ["usernameNormalized"])
    .index("by_user", ["userId"]),

  patientSessions: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    refreshTokenHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    deviceLabel: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  questionnaireTemplates: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    titleTranslations: v.optional(localizedTextValidator),
    descriptionTranslations: v.optional(localizedTextValidator),
    practitionerId: v.optional(v.id("users")), // System-wide if undefined
    source: v.optional(v.union(v.literal("system"), v.literal("practitioner"))),
    originTemplateId: v.optional(v.id("questionnaireTemplates")),
    tags: v.optional(v.array(v.string())),
    tagTranslations: v.optional(v.array(localizedTextValidator)),
    archivedAt: v.optional(v.number()),
    scoring: v.optional(scoringValidator),
    questions: v.array(
      v.object({
        id: v.string(), // Unique identifier for the question
        type: v.union(
          v.literal("short_text"),
          v.literal("long_text"),
          v.literal("multiple_choice"),
          v.literal("cards"),
          v.literal("boolean"),
          v.literal("numeric_scale")
        ),
        prompt: v.string(),
        promptTranslations: v.optional(localizedTextValidator),
        required: v.boolean(),
        options: v.optional(v.array(v.string())), // For multiple choice / cards
        optionTranslations: v.optional(v.array(localizedTextValidator)),
        scaleConfig: v.optional(
          v.object({
            min: v.number(),
            max: v.number(),
            minLabel: v.optional(v.string()),
            maxLabel: v.optional(v.string()),
            minLabelTranslations: v.optional(localizedTextValidator),
            maxLabelTranslations: v.optional(localizedTextValidator),
          })
        ), // For numeric_scale
      })
    ),
  }).index("by_practitioner", ["practitionerId"]),

  clinicQuestionnaireTemplates: defineTable({
    practitionerId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    addedAt: v.number(),
    quickAccessAt: v.optional(v.number()),
  })
    .index("by_practitioner", ["practitionerId"])
    .index("by_practitioner_template", ["practitionerId", "templateId"])
    .index("by_practitioner_quick_access", ["practitionerId", "quickAccessAt"]),

  questionnaireAssignments: defineTable({
    patientId: v.id("users"),
    practitionerId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    frequency: v.union(v.literal("once"), v.literal("daily"), v.literal("weekly"), v.literal("onDemand")),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(), // Date.now()
    archivedAt: v.optional(v.number()),
  })
    .index("by_patient", ["patientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_practitioner_patient_template", ["practitionerId", "patientId", "templateId"])
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
    availableAt: v.optional(v.number()),
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
