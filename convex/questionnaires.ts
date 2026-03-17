import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}

// 1. Templates
export const createTemplate = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("short_text"),
          v.literal("long_text"),
          v.literal("multiple_choice"),
          v.literal("boolean"),
          v.literal("numeric_scale")
        ),
        prompt: v.string(),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        scaleConfig: v.optional(
          v.object({
            min: v.number(),
            max: v.number(),
            minLabel: v.optional(v.string()),
            maxLabel: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const templateId = await ctx.db.insert("questionnaireTemplates", {
      title: args.title,
      description: args.description,
      practitionerId: user._id,
      questions: args.questions,
    });
    return templateId;
  },
});

export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // Fetch system-wide templates (where practitionerId is undefined) 
    // and practitioner-specific ones.
    const templates = await ctx.db.query("questionnaireTemplates").collect();
    return templates.filter((t) => !t.practitionerId || t.practitionerId === user._id);
  },
});

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("questionnaireTemplates").first();
    if (existing) return; // Already seeded

    await ctx.db.insert("questionnaireTemplates", {
      title: "Daily Mood Check-in",
      description: "A quick daily check-in on your mood and well-being.",
      questions: [
        {
          id: "q1_mood",
          type: "numeric_scale",
          prompt: "How would you rate your mood today?",
          required: true,
          scaleConfig: { min: 1, max: 10, minLabel: "Very Poor", maxLabel: "Excellent" },
        },
        {
          id: "q2_sleep",
          type: "multiple_choice",
          prompt: "How well did you sleep last night?",
          required: true,
          options: ["Very well", "Okay", "Poorly", "Hardly at all"],
        },
        {
          id: "q3_notes",
          type: "long_text",
          prompt: "Any additional notes or thoughts about your day?",
          required: false,
        },
      ],
    });

    await ctx.db.insert("questionnaireTemplates", {
      title: "Weekly Reflection",
      description: "A comprehensive look at your past week.",
      questions: [
        {
          id: "q1_highlight",
          type: "short_text",
          prompt: "What was the highlight of your week?",
          required: true,
        },
        {
          id: "q2_struggle",
          type: "short_text",
          prompt: "What was your biggest struggle this week?",
          required: true,
        },
        {
          id: "q3_goals_met",
          type: "boolean",
          prompt: "Did you meet your goals for the week?",
          required: true,
        },
      ],
    });
  },
});

// 2. Assignments
export const assign = mutation({
  args: {
    patientId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    frequency: v.union(v.literal("once"), v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    // Assign the questionnaire
    const assignmentId = await ctx.db.insert("questionnaireAssignments", {
      practitionerId: practitioner._id,
      patientId: args.patientId,
      templateId: args.templateId,
      frequency: args.frequency,
      status: "active",
      createdAt: Date.now(),
    });

    // Create the first instance right now to get them started
    let expiresAt: number | undefined;
    const now = Date.now();
    if (args.frequency === "daily") {
      // Expires in 24 hours
      expiresAt = now + 24 * 60 * 60 * 1000;
    } else if (args.frequency === "weekly") {
      // Expires in 7 days
      expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    }

    await ctx.db.insert("questionnaireInstances", {
      assignmentId,
      patientId: args.patientId,
      templateId: args.templateId,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    return assignmentId;
  },
});

export const listPatientAssignments = query({
  args: { patientId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");
    
    // Ensure the caller is either the patient or their practitioner
    if (user.role === "patient" && user._id !== args.patientId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("questionnaireAssignments")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();
  },
});

// 3. Instances / Submissions
export const listPendingInstances = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "patient") throw new Error("Unauthorized");

    const instances = await ctx.db
      .query("questionnaireInstances")
      .withIndex("by_patient", (q) => q.eq("patientId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
      
    // Fetch template details for each instance to render
    const results = await Promise.all(
      instances.map(async (instance) => {
        const template = await ctx.db.get(instance.templateId);
        return { ...instance, template };
      })
    );
    
    return results;
  },
});

export const listPatientHistory = query({
  args: { patientId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    let targetPatientId = user._id;
    if (user.role === "practitioner") {
      if (!args.patientId) throw new Error("Patient ID required for practitioners");
      targetPatientId = args.patientId;
    } else {
      targetPatientId = user._id;
    }

    const instances = await ctx.db
      .query("questionnaireInstances")
      .withIndex("by_patient", (q) => q.eq("patientId", targetPatientId))
      .collect();
      
    // Only return completed or expired instances
    const history = instances.filter(i => i.status !== "pending");
    
    // Sort by createdAt descending
    history.sort((a, b) => b.createdAt - a.createdAt);

    // Fetch template details for each instance to render
    const results = await Promise.all(
      history.map(async (instance) => {
        const template = await ctx.db.get(instance.templateId);
        return { ...instance, template };
      })
    );
    
    return results;
  },
});

export const getInstance = query({
  args: { instanceId: v.id("questionnaireInstances") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    if (user.role === "patient" && instance.patientId !== user._id) {
      throw new Error("Unauthorized");
    }

    const template = await ctx.db.get(instance.templateId);
    return { ...instance, template };
  },
});

export const submitInstance = mutation({
  args: {
    instanceId: v.id("questionnaireInstances"),
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "patient") throw new Error("Unauthorized");

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");
    if (instance.patientId !== user._id) throw new Error("Unauthorized");
    if (instance.status !== "pending") throw new Error("Instance is not pending");

    await ctx.db.patch(args.instanceId, {
      status: "completed",
      answers: args.answers,
      submittedAt: Date.now(),
    });
  },
});