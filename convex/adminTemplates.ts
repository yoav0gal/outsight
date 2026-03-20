import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

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

function normalizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function sanitizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function isArchivedTemplate(template: { archivedAt?: number }) {
  return typeof template.archivedAt === "number";
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
        tags: v.optional(v.array(v.string())),
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
        source: "system",
        originTemplateId: undefined,
        tags: normalizeTags(template.tags),
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
    tags: v.optional(v.array(v.string())),
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
      tags: normalizeTags(args.tags),
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

    const assignments = await ctx.db.query("questionnaireAssignments").collect();
    if (assignments.some((assignment) => assignment.templateId === args.templateId)) {
      throw new Error("This system template cannot be deleted because it has assignments");
    }

    const instances = await ctx.db.query("questionnaireInstances").collect();
    if (instances.some((instance) => instance.templateId === args.templateId)) {
      throw new Error("This system template cannot be deleted because it has submissions");
    }

    const memberships = await ctx.db.query("clinicQuestionnaireTemplates").collect();
    for (const membership of memberships) {
      if (membership.templateId === args.templateId) {
        await ctx.db.delete(membership._id);
      }
    }

    await ctx.db.delete(args.templateId);
  },
});
