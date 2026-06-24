import {
  internalAction,
  internalQuery,
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const localizedTextValidator = v.object({
  en: v.optional(v.string()),
  he: v.optional(v.string()),
});

const questionValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal("short_text"),
    v.literal("long_text"),
    v.literal("multiple_choice"),
    v.literal("cards"),
    v.literal("boolean"),
    v.literal("numeric_scale"),
    v.literal("instructions")
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

const answerEntryValidator = v.object({
  questionId: v.string(),
  value: v.union(v.string(), v.number(), v.boolean(), v.array(v.string())),
});

type AnswerValue = string | number | boolean | string[];

type TemplateScoring = {
  mode: "standard";
  includedQuestionIds: string[];
  answerScores?: Record<string, Record<string, number>>;
};

type QuestionnaireFrequency = "once" | "daily" | "weekly" | "onDemand";

type LocalizedText = {
  en?: string;
  he?: string;
};

type TemplateQuestion = {
  id: string;
  type: "short_text" | "long_text" | "multiple_choice" | "cards" | "boolean" | "numeric_scale" | "instructions";
  prompt: string;
  promptTranslations?: {
    en?: string;
    he?: string;
  };
  required: boolean;
  options?: string[];
  optionTranslations?: Array<{
    en?: string;
    he?: string;
  }>;
  scaleConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
    minLabelTranslations?: {
      en?: string;
      he?: string;
    };
    maxLabelTranslations?: {
      en?: string;
      he?: string;
    };
  };
};

type ScoreSummary = {
  mode: "standard";
  value: number;
  max: number | null;
  answeredQuestions: number;
  totalQuestions: number;
};

type EmailAnswerRow = {
  prompt: string;
  answer: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatAnswerValue(value: AnswerValue) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "No answer";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : "No answer";
}

function formatScoreSummary(score: ScoreSummary | null) {
  if (!score) {
    return null;
  }

  return score.max === null
    ? `${score.value}`
    : `${score.value}/${score.max}`;
}

function buildSubmissionEmailText(payload: {
  practitionerName: string;
  patientName: string;
  patientEmail?: string;
  questionnaireTitle: string;
  submittedAt: number;
  scoreLabel: string | null;
  answers: EmailAnswerRow[];
}) {
  const lines = [
    `Hi ${payload.practitionerName},`,
    "",
    `${payload.patientName} has submitted the questionnaire "${payload.questionnaireTitle}".`,
    payload.patientEmail ? `Patient email: ${payload.patientEmail}` : null,
    `Submitted at: ${new Date(payload.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    payload.scoreLabel ? `Score: ${payload.scoreLabel}` : null,
    "",
    "Answers:",
    ...payload.answers.map((answer, index) => `${index + 1}. ${answer.prompt}: ${answer.answer}`),
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

function buildSubmissionEmailHtml(payload: {
  practitionerName: string;
  patientName: string;
  patientEmail?: string;
  questionnaireTitle: string;
  submittedAt: number;
  scoreLabel: string | null;
  answers: EmailAnswerRow[];
}) {
  const submittedAt = new Date(payload.submittedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const answerRows = payload.answers
    .map(
      (answer) =>
        `<tr><td style="padding:12px;border-top:1px solid #e4e4e7;vertical-align:top;font-weight:600;">${escapeHtml(answer.prompt)}</td><td style="padding:12px;border-top:1px solid #e4e4e7;vertical-align:top;">${escapeHtml(answer.answer)}</td></tr>`
    )
    .join("");

  return [
    "<div style=\"font-family:Arial,sans-serif;color:#18181b;line-height:1.5;\">",
    `<p>Hi ${escapeHtml(payload.practitionerName)},</p>`,
    `<p><strong>${escapeHtml(payload.patientName)}</strong> has submitted the questionnaire <strong>${escapeHtml(payload.questionnaireTitle)}</strong>.</p>`,
    "<ul style=\"padding-left:20px;\">",
    payload.patientEmail
      ? `<li><strong>Patient email:</strong> ${escapeHtml(payload.patientEmail)}</li>`
      : "",
    `<li><strong>Submitted at:</strong> ${escapeHtml(submittedAt)}</li>`,
    payload.scoreLabel ? `<li><strong>Score:</strong> ${escapeHtml(payload.scoreLabel)}</li>` : "",
    "</ul>",
    "<table style=\"width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;\">",
    "<thead><tr style=\"background:#f4f4f5;\"><th style=\"padding:12px;text-align:left;\">Question</th><th style=\"padding:12px;text-align:left;\">Answer</th></tr></thead>",
    `<tbody>${answerRows}</tbody>`,
    "</table>",
    "</div>",
  ].join("");
}

function getAnswerScoreKey(value: AnswerValue) {
  if (Array.isArray(value)) {
    return value.join("|");
  }

  return String(value);
}

function getQuestionMaxScore(
  question: TemplateQuestion,
  answerScores?: Record<string, number>
) {
  if (answerScores) {
    const values = Object.values(answerScores);
    return values.length > 0 ? Math.max(...values) : null;
  }

  if (question.type === "multiple_choice" || question.type === "cards") {
    return question.options?.length ? question.options.length - 1 : null;
  }

  if (question.type === "numeric_scale") {
    return question.scaleConfig?.max ?? null;
  }

  if (question.type === "boolean") {
    return 1;
  }

  return null;
}

function getQuestionScore(
  question: TemplateQuestion,
  value: AnswerValue,
  answerScores?: Record<string, number>
) {
  if (answerScores) {
    const score = answerScores[getAnswerScoreKey(value)];
    return typeof score === "number" ? score : null;
  }

  if ((question.type === "multiple_choice" || question.type === "cards") && typeof value === "string") {
    const optionIndex = question.options?.findIndex((option) => option === value) ?? -1;
    return optionIndex >= 0 ? optionIndex : null;
  }

  if (question.type === "numeric_scale" && typeof value === "number") {
    return value;
  }

  if (question.type === "boolean" && typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return null;
}

function calculateScore(
  template: {
    questions: TemplateQuestion[];
    scoring?: TemplateScoring;
  },
  answers?: Array<{ questionId: string; value: AnswerValue }>
): ScoreSummary | null {
  if (!template.scoring || template.scoring.mode !== "standard" || !answers?.length) {
    return null;
  }

  const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer.value] as const));
  const questionsById = new Map(template.questions.map((question) => [question.id, question] as const));

  let value = 0;
  let max = 0;
  let hasKnownMax = true;
  let answeredQuestions = 0;

  for (const questionId of template.scoring.includedQuestionIds) {
    const question = questionsById.get(questionId);
    const answer = answersByQuestionId.get(questionId);

    if (!question || answer === undefined) {
      continue;
    }

    const questionScore = getQuestionScore(
      question,
      answer,
      template.scoring.answerScores?.[questionId]
    );

    if (questionScore === null) {
      continue;
    }

    answeredQuestions += 1;
    value += questionScore;

    const questionMax = getQuestionMaxScore(question, template.scoring.answerScores?.[questionId]);
    if (questionMax === null) {
      hasKnownMax = false;
    } else {
      max += questionMax;
    }
  }

  if (answeredQuestions === 0) {
    return null;
  }

  return {
    mode: "standard",
    value,
    max: hasKnownMax ? max : null,
    answeredQuestions,
    totalQuestions: template.scoring.includedQuestionIds.length,
  };
}

function attachScoreToInstance<
  T extends {
    answers?: Array<{ questionId: string; value: AnswerValue }>;
  },
>(
  instance: T,
  template: {
    questions: TemplateQuestion[];
    scoring?: TemplateScoring;
  } | null
) {
  return {
    ...instance,
    score: template ? calculateScore(template, instance.answers) : null,
  };
}

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}

async function deleteHistoryViewsForTemplate(
  ctx: MutationCtx,
  templateId: Id<"questionnaireTemplates">
) {
  const historyViews = await ctx.db.query("questionnaireHistoryViews").collect();

  for (const historyView of historyViews) {
    if (historyView.templateId === templateId) {
      await ctx.db.delete(historyView._id);
    }
  }
}

async function deleteAssignmentCascade(
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

  await ctx.db.delete(assignmentId);
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

async function getTemplateMemberships(
  ctx: QueryCtx | MutationCtx,
  practitionerId: Id<"users">
) {
  const memberships = await ctx.db
    .query("clinicQuestionnaireTemplates")
    .withIndex("by_practitioner", (q) => q.eq("practitionerId", practitionerId))
    .collect();

  return new Map(memberships.map((membership) => [membership.templateId, membership] as const));
}

async function getClinicTemplates(
  ctx: QueryCtx | MutationCtx,
  practitionerId: Id<"users">
) {
  const templates = await getVisibleTemplates(ctx, practitionerId);
  const memberships = await getTemplateMemberships(ctx, practitionerId);

  return templates
    .filter((template) => memberships.has(template._id) && !isArchivedTemplate(template))
    .map((template) => {
      const membership = memberships.get(template._id)!;
      return {
        ...template,
        isInClinic: true,
        isQuickAccess: typeof membership.quickAccessAt === "number",
        managedAt: membership.addedAt,
        quickAccessAt: membership.quickAccessAt,
      };
    })
    .sort((a, b) => {
      if (a.isQuickAccess !== b.isQuickAccess) {
        return a.isQuickAccess ? -1 : 1;
      }

      if (a.isQuickAccess && b.isQuickAccess) {
        return (b.quickAccessAt ?? 0) - (a.quickAccessAt ?? 0);
      }

      return a.title.localeCompare(b.title);
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

async function saveQuickAccessMembership(
  ctx: MutationCtx,
  practitionerId: Id<"users">,
  templateId: Id<"questionnaireTemplates">
) {
  const membershipId = await saveTemplateMembership(ctx, practitionerId, templateId);
  await ctx.db.patch(membershipId, {
    quickAccessAt: Date.now(),
  });
}

async function listAssignmentsForTemplate(
  ctx: MutationCtx,
  practitionerId: Id<"users">,
  patientId: Id<"users">,
  templateId: Id<"questionnaireTemplates">
) {
  const assignments = await ctx.db
    .query("questionnaireAssignments")
    .withIndex("by_practitioner_patient_template", (q) =>
      q.eq("practitionerId", practitionerId).eq("patientId", patientId).eq("templateId", templateId)
    )
    .collect();

  return assignments.sort((a, b) => {
    const aTimestamp = a.archivedAt ?? a.createdAt;
    const bTimestamp = b.archivedAt ?? b.createdAt;
    return bTimestamp - aTimestamp;
  });
}

async function getLatestPendingInstance(
  ctx: MutationCtx,
  assignmentId: Id<"questionnaireAssignments">
) {
  const instances = await ctx.db
    .query("questionnaireInstances")
    .withIndex("by_assignment", (q) => q.eq("assignmentId", assignmentId))
    .collect();

  return instances
    .filter((instance) => instance.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

async function createPendingInstanceForAssignment(
  ctx: MutationCtx,
  assignment: {
    _id: Id<"questionnaireAssignments">;
    patientId: Id<"users">;
    templateId: Id<"questionnaireTemplates">;
    frequency: QuestionnaireFrequency;
  },
  options?: {
    createdAt?: number;
    availableAt?: number;
  }
) {
  const createdAt = options?.createdAt ?? Date.now();
  const availableAt = options?.availableAt ?? createdAt;
  let expiresAt: number | undefined;

  if (assignment.frequency === "daily") {
    expiresAt = createdAt + 24 * 60 * 60 * 1000;
  } else if (assignment.frequency === "weekly") {
    expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000;
  }

  return await ctx.db.insert("questionnaireInstances", {
    assignmentId: assignment._id,
    patientId: assignment.patientId,
    templateId: assignment.templateId,
    status: "pending",
    createdAt,
    availableAt,
    expiresAt,
  });
}

function normalizeTemplate<
  T extends {
    practitionerId?: Id<"users">;
    source?: "system" | "practitioner";
    tags?: string[];
    tagTranslations?: LocalizedText[];
    archivedAt?: number;
    titleTranslations?: LocalizedText;
    descriptionTranslations?: LocalizedText;
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

function isArchivedAssignment(assignment: { status: "active" | "archived" | "completed" | "cancelled" }) {
  return assignment.status === "archived";
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

function normalizeTagTranslations(tagTranslations: LocalizedText[] | undefined) {
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
    titleTranslations: v.optional(localizedTextValidator),
    descriptionTranslations: v.optional(localizedTextValidator),
    tags: v.optional(v.array(v.string())),
    tagTranslations: v.optional(v.array(localizedTextValidator)),
    scoring: v.optional(scoringValidator),
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
      titleTranslations: args.titleTranslations,
      descriptionTranslations: args.descriptionTranslations,
      practitionerId: user._id,
      source: "practitioner",
      originTemplateId: undefined,
      tags: normalizedTags,
      tagTranslations: normalizeTagTranslations(args.tagTranslations),
      scoring: args.scoring,
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

export const listAssignableTemplates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const templates = await getActiveVisibleTemplates(ctx, user._id);
    const memberships = await getTemplateMemberships(ctx, user._id);

    return templates
      .map((template) => {
        const membership = memberships.get(template._id);
        return {
          ...template,
          isInClinic: !!membership,
          isQuickAccess: typeof membership?.quickAccessAt === "number",
        };
      })
      .sort((a, b) => {
        if (a.isQuickAccess !== b.isQuickAccess) {
          return a.isQuickAccess ? -1 : 1;
        }

        if (a.source !== b.source) {
          return a.source === "practitioner" ? -1 : 1;
        }

        return a.title.localeCompare(b.title);
      });
  },
});

export const listTemplatesExplorer = query({
  args: {
    search: v.optional(v.string()),
    source: v.optional(v.union(v.literal("all"), v.literal("system"), v.literal("practitioner"))),
    state: v.optional(v.union(v.literal("all"), v.literal("normalAccess"), v.literal("quickAccess"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "practitioner") throw new Error("Unauthorized");

    const templates = await getActiveVisibleTemplates(ctx, user._id);
    const memberships = await getTemplateMemberships(ctx, user._id);
    const search = args.search?.trim().toLocaleLowerCase();
    const sourceFilter = args.source ?? "all";
    const stateFilter = args.state ?? "all";

    return templates
      .filter((template) => {
        if (
          search &&
          [
            template.title,
            template.description ?? "",
            template.titleTranslations?.en ?? "",
            template.titleTranslations?.he ?? "",
            template.descriptionTranslations?.en ?? "",
            template.descriptionTranslations?.he ?? "",
            template.tags.join(" "),
            ...(template.tagTranslations?.map((tag) => `${tag.en ?? ""} ${tag.he ?? ""}`) ?? []),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(search)
        ) {
          return false;
        }

        if (sourceFilter !== "all" && template.source !== sourceFilter) {
          return false;
        }

        const membership = memberships.get(template._id);
        const isQuickAccess = typeof membership?.quickAccessAt === "number";

        if (stateFilter === "quickAccess" && !isQuickAccess) {
          return false;
        }

        if (stateFilter === "normalAccess" && isQuickAccess) {
          return false;
        }

        return true;
      })
      .map((template) => ({
        ...template,
        isInClinic: memberships.has(template._id),
        isQuickAccess: typeof memberships.get(template._id)?.quickAccessAt === "number",
      }))
      .sort((a, b) => {
        if (a.isQuickAccess !== b.isQuickAccess) {
          return a.isQuickAccess ? -1 : 1;
        }

        if (a.isInClinic !== b.isInClinic) {
          return a.isInClinic ? -1 : 1;
        }

        return a.title.localeCompare(b.title);
      });
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

    return (await getArchivedPractitionerTemplates(ctx, user._id)).map((template) => ({
      ...template,
      isInClinic: false,
      isQuickAccess: false,
    }));
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

    const membership = await ctx.db
      .query("clinicQuestionnaireTemplates")
      .withIndex("by_practitioner_template", (q) =>
        q.eq("practitionerId", user._id).eq("templateId", args.templateId)
      )
      .unique();

    return {
      ...normalizeTemplate(template),
      isInClinic: !!membership,
      isQuickAccess: typeof membership?.quickAccessAt === "number",
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

export const pinTemplateToQuickAccess = mutation({
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
      throw new Error("Archived templates cannot be added to quick access");
    }

    await saveQuickAccessMembership(ctx, user._id, args.templateId);
  },
});

export const unpinTemplateFromQuickAccess = mutation({
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
      await ctx.db.patch(membership._id, {
        quickAccessAt: undefined,
      });
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
    const relatedAssignments = assignments.filter((assignment) => assignment.templateId === args.templateId);

    const clinicMemberships = await ctx.db
      .query("clinicQuestionnaireTemplates")
      .withIndex("by_practitioner", (q) => q.eq("practitionerId", user._id))
      .collect();

    for (const membership of clinicMemberships) {
      if (membership.templateId === args.templateId) {
        await ctx.db.delete(membership._id);
      }
    }

    for (const assignment of relatedAssignments) {
      await deleteAssignmentCascade(ctx, assignment._id);
    }

    await deleteHistoryViewsForTemplate(ctx, args.templateId);

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

    await saveTemplateMembership(ctx, user._id, args.templateId);
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
      titleTranslations: template.titleTranslations,
      descriptionTranslations: template.descriptionTranslations,
      practitionerId: user._id,
      source: "practitioner",
      originTemplateId: template._id,
      tags: normalizeTags(template.tags),
      tagTranslations: normalizeTagTranslations(template.tagTranslations),
      scoring: template.scoring,
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
    titleTranslations: v.optional(localizedTextValidator),
    descriptionTranslations: v.optional(localizedTextValidator),
    tags: v.optional(v.array(v.string())),
    tagTranslations: v.optional(v.array(localizedTextValidator)),
    scoring: v.optional(scoringValidator),
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
      titleTranslations: args.titleTranslations,
      descriptionTranslations: args.descriptionTranslations,
      tags: normalizeTags(args.tags ?? template.tags ?? []),
      tagTranslations: normalizeTagTranslations(args.tagTranslations ?? template.tagTranslations),
      scoring: args.scoring ?? template.scoring,
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
        tagTranslations?: LocalizedText[];
        archivedAt?: number;
      } = {};

      if (!template.source) {
        patch.source = template.practitionerId ? "practitioner" : "system";
      }

      if (!template.tags) {
        patch.tags = [];
      }

      if (!template.tagTranslations) {
        patch.tagTranslations = [];
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
      titleTranslations: {
        en: "Daily Mood Check-in",
        he: "בדיקת מצב רוח יומית",
      },
      descriptionTranslations: {
        en: "A quick daily check-in on your mood and well-being.",
        he: "בדיקה יומית קצרה של מצב הרוח וההרגשה הכללית שלך.",
      },
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
      titleTranslations: {
        en: "Weekly Reflection",
        he: "רפלקציה שבועית",
      },
      descriptionTranslations: {
        en: "A comprehensive look at your past week.",
        he: "מבט מקיף על השבוע האחרון שלך.",
      },
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
    frequency: v.union(v.literal("once"), v.literal("daily"), v.literal("weekly"), v.literal("onDemand")),
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

    const normalizedTemplate = normalizeTemplate(template);

    if (isArchivedTemplate(normalizedTemplate)) {
      throw new Error("Archived templates cannot be assigned");
    }

    const relatedAssignments = await listAssignmentsForTemplate(
      ctx,
      practitioner._id,
      args.patientId,
      args.templateId
    );
    const activeAssignment =
      relatedAssignments.find((assignment) => assignment.status === "active") ??
      relatedAssignments.find((assignment) => assignment.status === "completed");
    const archivedAssignment = relatedAssignments.find((assignment) => assignment.status === "archived");

    if (activeAssignment) {
      throw new Error("A questionnaire for this template is already active for this patient");
    }

    if (archivedAssignment) {
      await ctx.db.patch(archivedAssignment._id, {
        status: "active",
        archivedAt: undefined,
        frequency: args.frequency,
      });

      const pendingInstance = await getLatestPendingInstance(ctx, archivedAssignment._id);
      if (!pendingInstance) {
        await createPendingInstanceForAssignment(
          ctx,
          {
            _id: archivedAssignment._id,
            patientId: archivedAssignment.patientId,
            templateId: archivedAssignment.templateId,
            frequency: args.frequency,
          }
        );
      }

      return {
        assignmentId: archivedAssignment._id,
        action: "restored" as const,
      };
    }

    const assignmentId = await ctx.db.insert("questionnaireAssignments", {
      practitionerId: practitioner._id,
      patientId: args.patientId,
      templateId: args.templateId,
      frequency: args.frequency,
      status: "active",
      createdAt: Date.now(),
    });

    await createPendingInstanceForAssignment(ctx, {
      _id: assignmentId,
      patientId: args.patientId,
      templateId: args.templateId,
      frequency: args.frequency,
    });

    return {
      assignmentId,
      action: "created" as const,
    };
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

    const assignments = await ctx.db
      .query("questionnaireAssignments")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();

    const assignmentsWithPending = await Promise.all(
      assignments.map(async (assignment) => {
        const pendingInstance = await ctx.db
          .query("questionnaireInstances")
          .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first();

        return {
          ...assignment,
          pendingInstanceId: pendingInstance?._id,
        };
      })
    );

    return assignmentsWithPending.sort((a, b) => b.createdAt - a.createdAt);
  },
});

async function getLatestPendingInstanceId(ctx: QueryCtx | MutationCtx, patientId: Id<"users">) {
  const now = Date.now();
  const instances = await ctx.db
    .query("questionnaireInstances")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .collect();

  const available = instances.filter((instance) => (instance.availableAt ?? 0) <= now);
  if (available.length === 0) {
    return null;
  }
  available.sort((a, b) => b.createdAt - a.createdAt);
  return available[0]._id;
}

// 3. Instances / Submissions
export const listPendingInstances = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "patient") throw new Error("Unauthorized");
    const now = Date.now();

    const identity = await ctx.auth.getUserIdentity();
    const isLinkOnly = identity?.authType === "link_only";

    const instances = await ctx.db
      .query("questionnaireInstances")
      .withIndex("by_patient", (q) => q.eq("patientId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Fetch template details for each instance to render
    const results = await Promise.all(
      instances
        .filter((instance) => (instance.availableAt ?? 0) <= now)
        .map(async (instance) => {
          const template = await ctx.db.get(instance.templateId);
          return attachScoreToInstance({ ...instance, template }, template);
        })
    );

    if (isLinkOnly) {
      if (results.length === 0) return [];
      results.sort((a, b) => b.createdAt - a.createdAt);
      return [results[0]];
    }

    return results;
  },
});

export const listPatientHistory = query({
  args: { patientId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.authType === "link_only") {
      throw new Error("Unauthorized: Link-only session cannot access history.");
    }

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
        return attachScoreToInstance({ ...instance, template }, template);
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
        const [template, latestInstance] = await Promise.all([
          ctx.db.get(summary.templateId),
          ctx.db.get(summary.latestInstanceId),
        ]);

        const latestScore =
          template && latestInstance
            ? attachScoreToInstance(latestInstance, template).score
            : null;

        return {
          ...summary,
          lastViewedAt: viewsByTemplateId.get(summary.templateId),
          latestScore,
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
    if (!user || user.role !== "practitioner") return null;

    const [template, instances, historyView, assignments] = await Promise.all([
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
      ctx.db
        .query("questionnaireAssignments")
        .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
        .collect(),
    ]);

    const history = instances
      .filter(
        (instance) =>
          instance.templateId === args.templateId && isHistoryInstance(instance)
      )
      .sort((a, b) => getInstanceHistoryTimestamp(b) - getInstanceHistoryTimestamp(a))
      .map((instance) => attachScoreToInstance(instance, template));

    const lastEntryAt = history[0] ? getInstanceHistoryTimestamp(history[0]) : null;
    const assignment = assignments
      .filter((item) => item.templateId === args.templateId)
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

    return {
      template,
      history,
      lastEntryAt,
      lastViewedAt: historyView?.lastViewedAt,
      unreadEntries: history.filter(
        (instance) =>
          getInstanceHistoryTimestamp(instance) > (historyView?.lastViewedAt ?? 0)
      ).length,
      assignment,
    };
  },
});

export const archiveQuestionnaireAssignment = mutation({
  args: { assignmentId: v.id("questionnaireAssignments") },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.practitionerId !== practitioner._id) {
      throw new Error("Assignment not found or unauthorized");
    }

    if (!isArchivedAssignment(assignment)) {
      await ctx.db.patch(args.assignmentId, {
        status: "archived",
        archivedAt: Date.now(),
      });
    }

    const instances = await ctx.db
      .query("questionnaireInstances")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    for (const instance of instances) {
      if (instance.status === "pending") {
        await ctx.db.delete(instance._id);
      }
    }
  },
});

export const unarchiveQuestionnaireAssignment = mutation({
  args: { assignmentId: v.id("questionnaireAssignments") },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.practitionerId !== practitioner._id) {
      throw new Error("Assignment not found or unauthorized");
    }

    const relatedAssignments = await listAssignmentsForTemplate(
      ctx,
      practitioner._id,
      assignment.patientId,
      assignment.templateId
    );
    const blockingAssignment = relatedAssignments.find(
      (candidate) =>
        candidate._id !== assignment._id &&
        (candidate.status === "active" || candidate.status === "completed")
    );

    if (blockingAssignment) {
      throw new Error("A questionnaire for this template is already active for this patient");
    }

    await ctx.db.patch(args.assignmentId, {
      status: "active",
      archivedAt: undefined,
    });

    const pendingInstance = await getLatestPendingInstance(ctx, assignment._id);
    if (!pendingInstance) {
      await createPendingInstanceForAssignment(ctx, {
        _id: assignment._id,
        patientId: assignment.patientId,
        templateId: assignment.templateId,
        frequency: assignment.frequency,
      });
    }
  },
});

export const deleteQuestionnaireAssignment = mutation({
  args: { assignmentId: v.id("questionnaireAssignments") },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.practitionerId !== practitioner._id) {
      throw new Error("Assignment not found or unauthorized");
    }

    await deleteAssignmentCascade(ctx, args.assignmentId);

    const historyViews = await ctx.db
      .query("questionnaireHistoryViews")
      .withIndex("by_practitioner_patient_template", (q) =>
        q.eq("practitionerId", practitioner._id).eq("patientId", assignment.patientId).eq("templateId", assignment.templateId)
      )
      .collect();

    for (const historyView of historyViews) {
      await ctx.db.delete(historyView._id);
    }
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

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.authType === "link_only") {
      if (user.role !== "patient" || instance.patientId !== user._id) {
        throw new Error("Unauthorized");
      }
      const latestPendingId = await getLatestPendingInstanceId(ctx, user._id);
      if (latestPendingId !== args.instanceId) {
        const completedInstances = await ctx.db
          .query("questionnaireInstances")
          .withIndex("by_patient", (q) => q.eq("patientId", user._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        if (completedInstances.length > 0) {
          completedInstances.sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
          if (completedInstances[0]._id !== args.instanceId) {
            throw new Error("Unauthorized: Link-only access is restricted to the latest pending or most recently completed questionnaire only.");
          }
        } else {
          throw new Error("Unauthorized: Link-only access is restricted to the latest pending questionnaire only.");
        }
      }
    }

    const template = await ctx.db.get(instance.templateId);
    return attachScoreToInstance({ ...instance, template }, template);
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
    answers: v.array(answerEntryValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "patient") throw new Error("Unauthorized");

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");
    if (instance.patientId !== user._id) throw new Error("Unauthorized");
    if (instance.status !== "pending") throw new Error("Instance is not pending");

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.authType === "link_only") {
      const latestPendingId = await getLatestPendingInstanceId(ctx, user._id);
      if (!latestPendingId || latestPendingId !== args.instanceId) {
        throw new Error("Unauthorized: Link-only access is restricted to the latest pending questionnaire only.");
      }
    }
    const assignment = await ctx.db.get(instance.assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    const now = Date.now();

    await ctx.db.patch(args.instanceId, {
      status: "completed",
      answers: args.answers,
      submittedAt: now,
    });

    if (assignment.frequency === "onDemand") {
      await createPendingInstanceForAssignment(
        ctx,
        {
          _id: assignment._id,
          patientId: assignment.patientId,
          templateId: assignment.templateId,
          frequency: assignment.frequency,
        },
        {
          createdAt: now,
          availableAt: now + 10 * 60 * 1000,
        }
      );
    }

    await ctx.scheduler.runAfter(0, internal.questionnaires.sendSubmissionNotificationEmail, {
      instanceId: args.instanceId,
    });
  },
});

export const getSubmissionNotificationEmailPayload = internalQuery({
  args: {
    instanceId: v.id("questionnaireInstances"),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance || instance.status !== "completed" || !instance.answers?.length || !instance.submittedAt) {
      return null;
    }

    const [assignment, patient, template] = await Promise.all([
      ctx.db.get(instance.assignmentId),
      ctx.db.get(instance.patientId),
      ctx.db.get(instance.templateId),
    ]);

    if (!assignment || !patient || !template) {
      return null;
    }

    const practitioner = await ctx.db.get(assignment.practitionerId);
    if (!practitioner?.email) {
      return null;
    }

    const answersByQuestionId = new Map(
      instance.answers.map((answer) => [answer.questionId, answer.value] as const)
    );

    const answers = template.questions
      .filter((question) => answersByQuestionId.has(question.id))
      .map((question) => ({
        prompt: question.prompt,
        answer: formatAnswerValue(answersByQuestionId.get(question.id) as AnswerValue),
      }));

    return {
      practitionerEmail: practitioner.email,
      practitionerName: practitioner.name ?? practitioner.accountName ?? "Practitioner",
      patientName: patient.name ?? patient.accountName ?? "Patient",
      patientEmail: patient.email ?? patient.loginIdentifier,
      questionnaireTitle: template.title,
      submittedAt: instance.submittedAt,
      answers,
      scoreLabel: formatScoreSummary(calculateScore(template, instance.answers)),
    };
  },
});

export const sendSubmissionNotificationEmail = internalAction({
  args: {
    instanceId: v.id("questionnaireInstances"),
  },
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(internal.questionnaires.getSubmissionNotificationEmailPayload, {
      instanceId: args.instanceId,
    });

    if (!payload) {
      return { skipped: true };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }

    if (!resendFromEmail) {
      throw new Error("Missing RESEND_FROM_EMAIL");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [payload.practitionerEmail],
        subject: `New questionnaire submission: ${payload.patientName} - ${payload.questionnaireTitle}`,
        text: buildSubmissionEmailText(payload),
        html: buildSubmissionEmailHtml(payload),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend request failed: ${response.status} ${body}`);
    }

    return { sent: true };
  },
});

export const createTestInstance = mutation({
  args: {
    assignmentId: v.id("questionnaireAssignments"),
    status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("expired"))),
    createdAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const practitioner = await getCurrentUser(ctx);
    if (!practitioner || practitioner.role !== "practitioner") {
      throw new Error("Unauthorized");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.practitionerId !== practitioner._id) {
      throw new Error("Assignment not found or unauthorized");
    }

    if (assignment.status !== "active") {
      throw new Error("Only active assignments can receive test instances");
    }

    const status = args.status ?? "completed";
    const createdAt = args.createdAt ?? Date.now();
    const availableAt =
      status === "pending" && assignment.frequency === "onDemand"
        ? createdAt + 10 * 60 * 1000
        : createdAt;

    let expiresAt: number | undefined;
    if (assignment.frequency === "daily") {
      expiresAt = createdAt + 24 * 60 * 60 * 1000;
    } else if (assignment.frequency === "weekly") {
      expiresAt = createdAt + 7 * 24 * 60 * 60 * 1000;
    }

    const instanceId = await ctx.db.insert("questionnaireInstances", {
      assignmentId: assignment._id,
      patientId: assignment.patientId,
      templateId: assignment.templateId,
      status,
      createdAt,
      availableAt,
      expiresAt,
      submittedAt: status === "completed" ? args.submittedAt ?? createdAt : undefined,
    });

    return instanceId;
  },
});
