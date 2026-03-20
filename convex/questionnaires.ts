import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const questionValidator = v.object({
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
});

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}

async function getVisibleTemplates(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const templates = await ctx.db.query("questionnaireTemplates").collect();

  return templates
    .filter((template) => !template.practitionerId || template.practitionerId === userId)
    .map((template) => normalizeTemplate(template))
    .sort((a, b) => a.title.localeCompare(b.title));
}

async function getActiveVisibleTemplates(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const templates = await getVisibleTemplates(ctx, userId);
  return templates.filter((template) => !isArchivedTemplate(template));
}

async function getArchivedPractitionerTemplates(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const templates = await getVisibleTemplates(ctx, userId);
  return templates.filter(
    (template) => template.practitionerId === userId && isArchivedTemplate(template)
  );
}

async function getClinicTemplateIds(
  ctx: QueryCtx | MutationCtx,
  practitionerId: Id<"users">
) {
  const memberships = await ctx.db
    .query("clinicQuestionnaireTemplates")
    .withIndex("by_practitioner", (q) => q.eq("practitionerId", practitionerId))
    .collect();

  return new Set(memberships.map((membership) => membership.templateId));
}

async function getClinicTemplates(
  ctx: QueryCtx | MutationCtx,
  practitionerId: Id<"users">
) {
  const templates = await getVisibleTemplates(ctx, practitionerId);
  const clinicTemplateIds = await getClinicTemplateIds(ctx, practitionerId);

  return templates.filter((template) => {
    if (!clinicTemplateIds.has(template._id)) {
      return false;
    }

    if (!isArchivedTemplate(template)) {
      return true;
    }

    return template.source === "system";
  });
}

async function saveTemplateMembership(
  ctx: MutationCtx,
  practitionerId: Id<"users">,
  templateId: Id<"questionnaireTemplates">
) {
  const existing = await ctx.db
    .query("clinicQuestionnaireTemplates")
    .withIndex("by_practitioner_template", (q) =>
      q.eq("practitionerId", practitionerId).eq("templateId", templateId)
    )
    .unique();

  if (existing) return existing._id;

  return await ctx.db.insert("clinicQuestionnaireTemplates", {
    practitionerId,
    templateId,
    addedAt: Date.now(),
  });
}

function normalizeTemplate<
  T extends {
    practitionerId?: Id<"users">;
    source?: "system" | "practitioner";
    tags?: string[];
    archivedAt?: number;
  },
>(template: T) {
  return {
    ...template,
    source: template.source ?? (template.practitionerId ? "practitioner" : "system"),
    tags: template.tags ?? [],
  };
}

function isArchivedTemplate(template: { archivedAt?: number }) {
  return typeof template.archivedAt === "number";
}

function normalizeTag(tag: string) {
  return tag.trim();
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

function normalizeTags(tags: string[] | undefined) {
  if (!tags) return [];

  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    const normalizedTag = normalizeTag(tag);
    const key = normalizedTag.toLocaleLowerCase();

    if (!normalizedTag || seen.has(key)) continue;

    seen.add(key);
    normalizedTags.push(normalizedTag);
  }

  return normalizedTags.sort((a, b) => a.localeCompare(b));
}

function normalizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function sanitizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

async function ensureUniquePractitionerTemplateTitle(
  ctx: MutationCtx,
  practitionerId: Id<"users">,
  title: string,
  excludeTemplateId?: Id<"questionnaireTemplates">
) {
  const normalizedTitle = normalizeTemplateTitle(title);
  const practitionerTemplates = await ctx.db
    .query("questionnaireTemplates")
    .withIndex("by_practitioner", (q) => q.eq("practitionerId", practitionerId))
    .collect();

  const duplicateTemplate = practitionerTemplates.find((template) => {
    if (excludeTemplateId && template._id === excludeTemplateId) {
      return false;
    }

    return normalizeTemplateTitle(template.title) === normalizedTitle;
  });

  if (duplicateTemplate) {
    throw new Error("A template with this name already exists in your clinic");
  }
}

async function getUniqueCopyTitle(
  ctx: MutationCtx,
  practitionerId: Id<"users">,
  baseTitle: string
) {
  const practitionerTemplates = await ctx.db
    .query("questionnaireTemplates")
    .withIndex("by_practitioner", (q) => q.eq("practitionerId", practitionerId))
    .collect();

  const existingTitles = new Set(
    practitionerTemplates.map((template) => normalizeTemplateTitle(template.title))
  );

  if (!existingTitles.has(normalizeTemplateTitle(baseTitle))) {
    return baseTitle;
  }

  let suffix = 2;
  let candidate = `${baseTitle} (${suffix})`;

  while (existingTitles.has(normalizeTemplateTitle(candidate))) {
    suffix += 1;
    candidate = `${baseTitle} (${suffix})`;
  }

  return candidate;
}

// 1. Templates
export const createTemplate = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");
    const sanitizedTitle = sanitizeTemplateTitle(args.title);
    await ensureUniquePractitionerTemplateTitle(ctx, user._id, sanitizedTitle);
    const normalizedTags = normalizeTags(args.tags);

    const templateId = await ctx.db.insert("questionnaireTemplates", {
      title: sanitizedTitle,
      description: args.description,
      practitionerId: user._id,
      source: "practitioner",
      originTemplateId: undefined,
      tags: normalizedTags,
      questions: args.questions,
    });

    await saveTemplateMembership(ctx, user._id, templateId);

    return templateId;
  },
});

export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    return await getVisibleTemplates(ctx, user._id);
  },
});

export const listClinicTemplates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    return await getClinicTemplates(ctx, user._id);
  },
});

export const listTemplatesExplorer = query({
  args: {
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const templates = await getActiveVisibleTemplates(ctx, user._id);
    const clinicTemplateIds = await getClinicTemplateIds(ctx, user._id);
    const search = args.search?.trim().toLocaleLowerCase();
    const selectedTags = normalizeTags(args.tags);
    const selectedTagKeys = new Set(selectedTags.map((tag) => tag.toLocaleLowerCase()));

    return templates
      .filter((template) => {
        if (search && !template.title.toLocaleLowerCase().includes(search)) {
          return false;
        }

        if (
          selectedTagKeys.size > 0 &&
          !template.tags.some((tag) => selectedTagKeys.has(tag.toLocaleLowerCase()))
        ) {
          return false;
        }

        return true;
      })
      .map((template) => ({
        ...template,
        isInClinic: clinicTemplateIds.has(template._id),
      }));
  },
});

export const listTemplateTags = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const templates = await getActiveVisibleTemplates(ctx, user._id);
    return [...new Set(templates.flatMap((template) => normalizeTags(template.tags)))].sort(
      (a, b) => a.localeCompare(b)
    );
  },
});

export const listArchivedTemplates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    return await getArchivedPractitionerTemplates(ctx, user._id);
  },
});

export const getTemplate = query({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.practitionerId && template.practitionerId !== user._id) {
      throw new Error("Unauthorized");
    }

    const clinicTemplateIds = await getClinicTemplateIds(ctx, user._id);

    return {
      ...normalizeTemplate(template),
      isInClinic: clinicTemplateIds.has(template._id),
    };
  },
});

export const saveTemplateToClinic = mutation({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.practitionerId && template.practitionerId !== user._id) {
      throw new Error("Unauthorized");
    }
    if (isArchivedTemplate(template)) {
      throw new Error("Archived templates cannot be saved to clinic");
    }

    await saveTemplateMembership(ctx, user._id, args.templateId);
  },
});

export const removeTemplateFromClinic = mutation({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const membership = await ctx.db
      .query("clinicQuestionnaireTemplates")
      .withIndex("by_practitioner_template", (q) =>
        q.eq("practitionerId", user._id).eq("templateId", args.templateId)
      )
      .unique();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.practitionerId !== user._id) {
      throw new Error("Only practitioner-owned templates can be deleted");
    }

    const assignments = await ctx.db
      .query("questionnaireAssignments")
      .withIndex("by_practitioner", (q) => q.eq("practitionerId", user._id))
      .collect();
    const relatedAssignments = assignments.filter(
      (assignment) => assignment.templateId === args.templateId
    );

    if (relatedAssignments.length > 0) {
      throw new Error("This template cannot be deleted because it has assignments");
    }

    const instances = await ctx.db.query("questionnaireInstances").collect();
    const hasRelatedInstance = instances.some(
      (instance) => instance.templateId === args.templateId
    );

    if (hasRelatedInstance) {
      throw new Error("This template cannot be deleted because it has submissions");
    }

    const clinicMemberships = await ctx.db
      .query("clinicQuestionnaireTemplates")
      .withIndex("by_practitioner", (q) => q.eq("practitionerId", user._id))
      .collect();

    for (const membership of clinicMemberships) {
      if (membership.templateId === args.templateId) {
        await ctx.db.delete(membership._id);
      }
    }

    await ctx.db.delete(args.templateId);
  },
});

export const archiveTemplate = mutation({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.practitionerId !== user._id) {
      throw new Error("Only practitioner-owned templates can be archived");
    }

    if (!isArchivedTemplate(template)) {
      await ctx.db.patch(args.templateId, {
        archivedAt: Date.now(),
      });
    }

    const clinicMemberships = await ctx.db
      .query("clinicQuestionnaireTemplates")
      .withIndex("by_practitioner", (q) => q.eq("practitionerId", user._id))
      .collect();

    for (const membership of clinicMemberships) {
      if (membership.templateId === args.templateId) {
        await ctx.db.delete(membership._id);
      }
    }
  },
});

export const unarchiveTemplate = mutation({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.practitionerId !== user._id) {
      throw new Error("Only practitioner-owned templates can be restored");
    }

    await ctx.db.patch(args.templateId, {
      archivedAt: undefined,
    });
  },
});

export const createEditableTemplateCopy = mutation({
  args: { templateId: v.id("questionnaireTemplates") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    if (template.practitionerId === user._id) {
      await saveTemplateMembership(ctx, user._id, template._id);
      return template._id;
    }

    const copyTitle = await getUniqueCopyTitle(ctx, user._id, template.title);

    const copyId = await ctx.db.insert("questionnaireTemplates", {
      title: copyTitle,
      description: template.description,
      practitionerId: user._id,
      source: "practitioner",
      originTemplateId: template._id,
      tags: normalizeTags(template.tags),
      questions: template.questions,
    });

    await saveTemplateMembership(ctx, user._id, copyId);

    return copyId;
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("questionnaireTemplates"),
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");
    const sanitizedTitle = sanitizeTemplateTitle(args.title);
    await ensureUniquePractitionerTemplateTitle(ctx, user._id, sanitizedTitle, args.templateId);

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.practitionerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.templateId, {
      title: sanitizedTitle,
      description: args.description,
      tags: normalizeTags(args.tags ?? template.tags ?? []),
      questions: args.questions,
    });
  },
});

export const backfillTemplateMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const templates = await ctx.db.query("questionnaireTemplates").collect();

    for (const template of templates) {
      const patch: {
        source?: "system" | "practitioner";
        tags?: string[];
        archivedAt?: number;
      } = {};

      if (!template.source) {
        patch.source = template.practitionerId ? "practitioner" : "system";
      }

      if (!template.tags) {
        patch.tags = [];
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(template._id, patch);
      }
    }
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
      source: "system",
      tags: ["Mood", "Daily"],
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
      source: "system",
      tags: ["Reflection", "Weekly"],
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

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const clinicMembership = await ctx.db
      .query("clinicQuestionnaireTemplates")
      .withIndex("by_practitioner_template", (q) =>
        q.eq("practitionerId", practitioner._id).eq("templateId", args.templateId)
      )
      .unique();

    if (!clinicMembership) {
      throw new Error("Template must be saved in clinic before assignment");
    }

    const normalizedTemplate = normalizeTemplate(template);
    const canAssignArchivedSystemTemplate =
      isArchivedTemplate(normalizedTemplate) && normalizedTemplate.source === "system";

    if (isArchivedTemplate(normalizedTemplate) && !canAssignArchivedSystemTemplate) {
      throw new Error("Archived templates cannot be assigned");
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
    const history = instances.filter(isHistoryInstance);
    
    // Sort by most recent history event descending
    history.sort((a, b) => getInstanceHistoryTimestamp(b) - getInstanceHistoryTimestamp(a));

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

export const listPractitionerPatientHistorySummaries = query({
  args: { patientId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const [instances, viewRows] = await Promise.all([
      ctx.db
        .query("questionnaireInstances")
        .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
        .collect(),
      ctx.db
        .query("questionnaireHistoryViews")
        .withIndex("by_practitioner_patient", (q) =>
          q.eq("practitionerId", user._id).eq("patientId", args.patientId)
        )
        .collect(),
    ]);

    const groupedHistory = instances.filter(isHistoryInstance);
    const viewsByTemplateId = new Map(
      viewRows.map((row) => [row.templateId, row.lastViewedAt] as const)
    );
    const summaries = new Map<
      Id<"questionnaireTemplates">,
      {
        templateId: Id<"questionnaireTemplates">;
        totalEntries: number;
        unreadEntries: number;
        lastEntryAt: number;
        latestInstanceId: Id<"questionnaireInstances">;
        latestStatus: "completed" | "expired";
      }
    >();

    for (const instance of groupedHistory) {
      const historyTimestamp = getInstanceHistoryTimestamp(instance);
      const lastViewedAt = viewsByTemplateId.get(instance.templateId) ?? 0;
      const existing = summaries.get(instance.templateId);

      if (!existing) {
        summaries.set(instance.templateId, {
          templateId: instance.templateId,
          totalEntries: 1,
          unreadEntries: historyTimestamp > lastViewedAt ? 1 : 0,
          lastEntryAt: historyTimestamp,
          latestInstanceId: instance._id,
          latestStatus: instance.status,
        });
        continue;
      }

      existing.totalEntries += 1;
      if (historyTimestamp > lastViewedAt) {
        existing.unreadEntries += 1;
      }

      if (historyTimestamp > existing.lastEntryAt) {
        existing.lastEntryAt = historyTimestamp;
        existing.latestInstanceId = instance._id;
        existing.latestStatus = instance.status;
      }
    }

    const results = await Promise.all(
      Array.from(summaries.values()).map(async (summary) => {
        const template = await ctx.db.get(summary.templateId);
        return {
          ...summary,
          lastViewedAt: viewsByTemplateId.get(summary.templateId),
          template,
        };
      })
    );

    return results.sort((a, b) => b.lastEntryAt - a.lastEntryAt);
  },
});

export const listPractitionerPatientTemplateHistory = query({
  args: {
    patientId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const [template, instances, historyView] = await Promise.all([
      ctx.db.get(args.templateId),
      ctx.db
        .query("questionnaireInstances")
        .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
        .collect(),
      ctx.db
        .query("questionnaireHistoryViews")
        .withIndex("by_practitioner_patient_template", (q) =>
          q
            .eq("practitionerId", user._id)
            .eq("patientId", args.patientId)
            .eq("templateId", args.templateId)
        )
        .unique(),
    ]);

    const history = instances
      .filter(
        (instance) =>
          instance.templateId === args.templateId && isHistoryInstance(instance)
      )
      .sort((a, b) => getInstanceHistoryTimestamp(b) - getInstanceHistoryTimestamp(a));

    const lastEntryAt = history[0] ? getInstanceHistoryTimestamp(history[0]) : null;

    return {
      template,
      history,
      lastEntryAt,
      lastViewedAt: historyView?.lastViewedAt,
      unreadEntries: history.filter(
        (instance) =>
          getInstanceHistoryTimestamp(instance) > (historyView?.lastViewedAt ?? 0)
      ).length,
    };
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

export const markPractitionerPatientTemplateHistoryViewed = mutation({
  args: {
    patientId: v.id("users"),
    templateId: v.id("questionnaireTemplates"),
    viewedThroughAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("questionnaireHistoryViews")
      .withIndex("by_practitioner_patient_template", (q) =>
        q
          .eq("practitionerId", user._id)
          .eq("patientId", args.patientId)
          .eq("templateId", args.templateId)
      )
      .unique();

    if (existing) {
      if (args.viewedThroughAt > existing.lastViewedAt) {
        await ctx.db.patch(existing._id, {
          lastViewedAt: args.viewedThroughAt,
        });
      }

      return existing._id;
    }

    return await ctx.db.insert("questionnaireHistoryViews", {
      practitionerId: user._id,
      patientId: args.patientId,
      templateId: args.templateId,
      lastViewedAt: args.viewedThroughAt,
    });
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
