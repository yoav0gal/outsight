import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const localizedTextValidator = v.object({
  en: v.optional(v.string()),
  he: v.optional(v.string()),
});

function assertAdminSecret(adminSecret: string) {
  const expectedSecret = process.env.ADMIN_DASHBOARD_API_SECRET;
  if (!expectedSecret || adminSecret !== expectedSecret) {
    throw new Error("Unauthorized");
  }
}

const questionValidator = v.object({
  id: v.string(),
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
  options: v.optional(v.array(v.string())),
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
  ),
});

const scoringValidator = v.object({
  mode: v.literal("standard"),
  includedQuestionIds: v.array(v.string()),
  answerScores: v.optional(v.record(v.string(), v.record(v.string(), v.number()))),
});

function normalizeTag(tag: string) {
  return tag.trim();
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

function normalizeTagTranslations(tagTranslations: { en?: string; he?: string }[] | undefined) {
  if (!tagTranslations) return undefined;

  return tagTranslations.map((tagTranslation) => ({
    ...(typeof tagTranslation.en === "string" && tagTranslation.en.trim()
      ? { en: tagTranslation.en.trim() }
      : {}),
    ...(typeof tagTranslation.he === "string" && tagTranslation.he.trim()
      ? { he: tagTranslation.he.trim() }
      : {}),
  }));
}

function normalizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function sanitizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function isArchivedTemplate(template: { archivedAt?: number }) {
  return typeof template.archivedAt === "number";
}

async function deleteQuestionnaireInstancesForAssignment(
  ctx: MutationCtx,
  assignmentId: Id<"questionnaireAssignments">
) {
  const instances = await ctx.db
    .query("questionnaireInstances")
    .withIndex("by_assignment", (q) => q.eq("assignmentId", assignmentId))
    .collect();

  for (const instance of instances) {
    await ctx.db.delete(instance._id);
  }
}

async function deleteQuestionnaireDataForTemplate(
  ctx: MutationCtx,
  templateId: Id<"questionnaireTemplates">
) {
  const [assignments, historyViews, memberships, instances] = await Promise.all([
    ctx.db.query("questionnaireAssignments").collect(),
    ctx.db.query("questionnaireHistoryViews").collect(),
    ctx.db.query("clinicQuestionnaireTemplates").collect(),
    ctx.db.query("questionnaireInstances").collect(),
  ]);

  for (const membership of memberships) {
    if (membership.templateId === templateId) {
      await ctx.db.delete(membership._id);
    }
  }

  for (const historyView of historyViews) {
    if (historyView.templateId === templateId) {
      await ctx.db.delete(historyView._id);
    }
  }

  for (const instance of instances) {
    if (instance.templateId === templateId) {
      await ctx.db.delete(instance._id);
    }
  }

  for (const assignment of assignments) {
    if (assignment.templateId !== templateId) {
      continue;
    }

    await deleteQuestionnaireInstancesForAssignment(ctx, assignment._id);
    await ctx.db.delete(assignment._id);
  }
}

async function ensureUniqueSystemTemplateTitle(
  ctx: MutationCtx,
  title: string,
  excludeTemplateId?: Id<"questionnaireTemplates">
) {
  const normalizedTitle = normalizeTemplateTitle(title);
  const templates = await ctx.db.query("questionnaireTemplates").collect();

  const duplicateTemplate = templates.find((template) => {
    if (template.practitionerId) return false;
    if (excludeTemplateId && template._id === excludeTemplateId) return false;
    return normalizeTemplateTitle(template.title) === normalizedTitle;
  });

  if (duplicateTemplate) {
    throw new Error("A system template with this name already exists");
  }
}

export const listSystemTemplatesAdmin = query({
  args: {
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const templates = await ctx.db.query("questionnaireTemplates").collect();

    return templates
      .filter((template) => !template.practitionerId)
      .map((template) => ({
        ...template,
        source: "system" as const,
        tags: normalizeTags(template.tags),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const listAllTemplateTagsAdmin = query({
  args: {
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const templates = await ctx.db.query("questionnaireTemplates").collect();
    return [...new Set(templates.flatMap((template) => normalizeTags(template.tags)))].sort((a, b) =>
      a.localeCompare(b)
    );
  },
});

export const getSystemTemplateAdmin = query({
  args: {
    adminSecret: v.string(),
    templateId: v.id("questionnaireTemplates"),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const template = await ctx.db.get(args.templateId);
    if (!template || template.practitionerId) {
      throw new Error("Template not found");
    }

    return {
      ...template,
      source: "system" as const,
      tags: normalizeTags(template.tags),
    };
  },
});

export const createSystemTemplatesAdmin = mutation({
  args: {
    adminSecret: v.string(),
    templates: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        titleTranslations: v.optional(localizedTextValidator),
        descriptionTranslations: v.optional(localizedTextValidator),
        tags: v.optional(v.array(v.string())),
        tagTranslations: v.optional(v.array(localizedTextValidator)),
        scoring: v.optional(scoringValidator),
        questions: v.array(questionValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const normalizedTitles = new Set<string>();
    for (const template of args.templates) {
      const sanitizedTitle = sanitizeTemplateTitle(template.title);
      const normalizedTitle = normalizeTemplateTitle(sanitizedTitle);
      if (normalizedTitles.has(normalizedTitle)) {
        throw new Error("Upload contains duplicate system template titles");
      }
      normalizedTitles.add(normalizedTitle);
      await ensureUniqueSystemTemplateTitle(ctx, sanitizedTitle);
    }

    const insertedIds: string[] = [];

    for (const template of args.templates) {
      const templateId = await ctx.db.insert("questionnaireTemplates", {
        title: sanitizeTemplateTitle(template.title),
        description: template.description,
        titleTranslations: template.titleTranslations,
        descriptionTranslations: template.descriptionTranslations,
        source: "system",
        originTemplateId: undefined,
        tags: normalizeTags(template.tags),
        tagTranslations: normalizeTagTranslations(template.tagTranslations),
        scoring: template.scoring,
        questions: template.questions,
      });

      insertedIds.push(templateId);
    }

    return insertedIds;
  },
});

export const updateSystemTemplateAdmin = mutation({
  args: {
    adminSecret: v.string(),
    templateId: v.id("questionnaireTemplates"),
    title: v.string(),
    description: v.optional(v.string()),
    titleTranslations: v.optional(localizedTextValidator),
    descriptionTranslations: v.optional(localizedTextValidator),
    tags: v.optional(v.array(v.string())),
    tagTranslations: v.optional(v.array(localizedTextValidator)),
    scoring: v.optional(scoringValidator),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const template = await ctx.db.get(args.templateId);
    if (!template || template.practitionerId) {
      throw new Error("Template not found");
    }

    const sanitizedTitle = sanitizeTemplateTitle(args.title);
    await ensureUniqueSystemTemplateTitle(ctx, sanitizedTitle, args.templateId);

    await ctx.db.patch(args.templateId, {
      title: sanitizedTitle,
      description: args.description,
      titleTranslations: args.titleTranslations,
      descriptionTranslations: args.descriptionTranslations,
      tags: normalizeTags(args.tags),
      tagTranslations: normalizeTagTranslations(args.tagTranslations),
      scoring: args.scoring ?? template.scoring,
      questions: args.questions,
    });

    return args.templateId;
  },
});

export const archiveSystemTemplateAdmin = mutation({
  args: {
    adminSecret: v.string(),
    templateId: v.id("questionnaireTemplates"),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const template = await ctx.db.get(args.templateId);
    if (!template || template.practitionerId) {
      throw new Error("Template not found");
    }

    if (!isArchivedTemplate(template)) {
      await ctx.db.patch(args.templateId, {
        archivedAt: Date.now(),
      });
    }
  },
});

export const unarchiveSystemTemplateAdmin = mutation({
  args: {
    adminSecret: v.string(),
    templateId: v.id("questionnaireTemplates"),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const template = await ctx.db.get(args.templateId);
    if (!template || template.practitionerId) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      archivedAt: undefined,
    });
  },
});

export const deleteSystemTemplateAdmin = mutation({
  args: {
    adminSecret: v.string(),
    templateId: v.id("questionnaireTemplates"),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);

    const template = await ctx.db.get(args.templateId);
    if (!template || template.practitionerId) {
      throw new Error("Template not found");
    }

    await deleteQuestionnaireDataForTemplate(ctx, args.templateId);

    await ctx.db.delete(args.templateId);
  },
});
