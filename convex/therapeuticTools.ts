import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const PREDEFINED_TOOLS = [
  { key: "cognitiveRestructuring", nameEn: "Cognitive Restructuring", nameHe: "שחזור קוגניטיבי (CBT)", isActive: true, order: 1 },
  { key: "behavioralActivation", nameEn: "Behavioral Activation", nameHe: "אקטיבציה התנהגותית (CBT)", isActive: true, order: 2 },
  { key: "exposureTherapy", nameEn: "Exposure Therapy", nameHe: "טיפול בחשיפה (CBT/ERP)", isActive: true, order: 3 },
  { key: "thoughtRecord", nameEn: "Thought Record / Journaling", nameHe: "יומן מחשבות / כתיבה טיפולית", isActive: true, order: 4 },
  { key: "mindfulnessWiseMind", nameEn: "Mindfulness (Wise Mind)", nameHe: "מיינדפולנס (התודעה החכמה - DBT)", isActive: true, order: 5 },
  { key: "distressToleranceTIPP", nameEn: "Distress Tolerance (TIPP)", nameHe: "עמידות במצוקה (מיומנויות TIPP - DBT)", isActive: true, order: 6 },
  { key: "distressToleranceDistraction", nameEn: "Distress Tolerance (Distraction)", nameHe: "עמידות במצוקה (הסחת דעת - DBT)", isActive: true, order: 7 },
  { key: "emotionRegulationOppositeAction", nameEn: "Emotion Regulation (Opposite Action)", nameHe: "ויסות רגשי (פעולה הפוכה - DBT)", isActive: true, order: 8 },
  { key: "emotionRegulationCheckFacts", nameEn: "Emotion Regulation (Check the Facts)", nameHe: "ויסות רגשי (בדיקת עובדות - DBT)", isActive: true, order: 9 },
  { key: "interpersonalDearMan", nameEn: "Interpersonal Effectiveness (DEAR MAN)", nameHe: "יעילות בין-אישית (DEAR MAN - DBT)", isActive: true, order: 10 },
  { key: "interpersonalFastGive", nameEn: "Interpersonal Effectiveness (GIVE/FAST)", nameHe: "יעילות בין-אישית (GIVE/FAST - DBT)", isActive: true, order: 11 },
  { key: "defusionACT", nameEn: "Defusion Techniques (ACT)", nameHe: "טכניקות הפרדה/דיפוזיה (ACT)", isActive: true, order: 12 },
  { key: "valuesACT", nameEn: "Values Clarification (ACT)", nameHe: "בירור ערכים (ACT)", isActive: true, order: 13 },
  { key: "acceptanceACT", nameEn: "Acceptance / Willingness (ACT)", nameHe: "קבלה ונכונות (ACT)", isActive: true, order: 14 },
  { key: "guidedMeditation", nameEn: "Guided Meditation", nameHe: "מדיטציה מונחית", isActive: true, order: 15 },
  { key: "breathingExercises", nameEn: "Breathing Exercises", nameHe: "תרגילי נשימה / ויסות נשימה", isActive: true, order: 16 },
  { key: "groundingTechniques", nameEn: "Grounding (5-4-3-2-1)", nameHe: "קרקוע (חמשת החושים 5-4-3-2-1)", isActive: true, order: 17 },
  { key: "socraticQuestioning", nameEn: "Socratic Questioning", nameHe: "תשאול סוקרטי", isActive: true, order: 18 },
  { key: "somaticTracking", nameEn: "Somatic Tracking", nameHe: "שחזור/מעקב סומטי", isActive: true, order: 19 },
  { key: "emptyChairGestalt", nameEn: "Empty Chair Technique", nameHe: "טכניקת הכיסא הריק (גשטלט)", isActive: true, order: 20 },
  { key: "emdrBilateral", nameEn: "EMDR (Bilateral Stimulation)", nameHe: "EMDR (גירוי דו-צדדי)", isActive: true, order: 21 },
  { key: "rolePlay", nameEn: "Role Play / Behavioral Rehearsal", nameHe: "משחק תפקידים / סימולציה התנהגותית", isActive: true, order: 22 },
  { key: "progressiveMuscleRelaxation", nameEn: "Progressive Muscle Relaxation", nameHe: "הרפיית שרירים הדרגתית (PMR)", isActive: true, order: 23 },
  { key: "selfCompassion", nameEn: "Self-Compassion Exercises", nameHe: "תרגול חמלה עצמית", isActive: true, order: 24 },
  { key: "motivationalInterviewing", nameEn: "Motivational Interviewing", nameHe: "ראיון מוטיבציוני", isActive: true, order: 25 },
  { key: "gratitudeJournaling", nameEn: "Gratitude Journaling", nameHe: "יומן הכרת תודה", isActive: true, order: 26 },
  { key: "sleepHygiene", nameEn: "Sleep Hygiene Education", nameHe: "הדרכת היגיינת שינה (CBT-I)", isActive: true, order: 27 },
  { key: "conflictResolution", nameEn: "Conflict Resolution Tools", nameHe: "כלים לפתרון קונפליקטים", isActive: true, order: 28 },
  { key: "innerChild", nameEn: "Inner Child Work", nameHe: "עבודה עם הילד הפנימי", isActive: true, order: 29 },
  { key: "psychoeducation", nameEn: "Psychoeducation", nameHe: "פסיכו-אדיוקיישן (הסבר פסיכולוגי)", isActive: true, order: 30 }
];

function assertAdminSecret(adminSecret: string) {
  const expectedSecret = process.env.ADMIN_DASHBOARD_API_SECRET;
  if (!expectedSecret || adminSecret !== expectedSecret) {
    throw new Error("Unauthorized");
  }
}

async function ensureSeeded(ctx: MutationCtx) {
  const existing = await ctx.db.query("therapeuticTools").collect();
  if (existing.length === 0) {
    for (const tool of PREDEFINED_TOOLS) {
      await ctx.db.insert("therapeuticTools", tool);
    }
  }
}

/**
 * Public query for practitioners to fetch active tools.
 */
export const listToolsPublic = query({
  args: {},
  handler: async (ctx) => {
    // Authenticate practitioner
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user || user.role !== "practitioner") {
      return [];
    }

    const tools = await ctx.db.query("therapeuticTools").withIndex("by_order").collect();
    if (tools.length === 0) {
      // Return predefined list if DB not seeded yet
      return PREDEFINED_TOOLS.map((t, index) => ({
        _id: `temp_${index}` as unknown as Id<"therapeuticTools">,
        _creationTime: Date.now(),
        ...t,
      }));
    }
    return tools.filter((t) => t.isActive);
  },
});

/**
 * Admin query to fetch all tools (both active and inactive).
 */
export const listToolsAdmin = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    const tools = await ctx.db.query("therapeuticTools").withIndex("by_order").collect();
    if (tools.length === 0) {
      return PREDEFINED_TOOLS.map((t, index) => ({
        _id: `temp_${index}` as unknown as Id<"therapeuticTools">,
        _creationTime: Date.now(),
        ...t,
      }));
    }
    return tools;
  },
});

/**
 * Seed tools explicitly if needed.
 */
export const seedToolsAdmin = mutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    await ensureSeeded(ctx);
    return true;
  },
});

/**
 * Admin mutation to add or update a tool.
 */
export const upsertToolAdmin = mutation({
  args: {
    adminSecret: v.string(),
    id: v.optional(v.id("therapeuticTools")),
    key: v.string(),
    nameEn: v.string(),
    nameHe: v.string(),
    isActive: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    await ensureSeeded(ctx);

    const { id, key, nameEn, nameHe, isActive, order } = args;

    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing) {
        throw new Error("Tool not found");
      }
      await ctx.db.patch(id, { key, nameEn, nameHe, isActive, order });
      return id;
    } else {
      // Check if key already exists
      const existingByKey = await ctx.db
        .query("therapeuticTools")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existingByKey) {
        throw new Error("A tool with this key already exists");
      }
      return await ctx.db.insert("therapeuticTools", { key, nameEn, nameHe, isActive, order });
    }
  },
});

/**
 * Admin mutation to delete a tool.
 */
export const deleteToolAdmin = mutation({
  args: {
    adminSecret: v.string(),
    id: v.id("therapeuticTools"),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    await ensureSeeded(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Tool not found");
    }
    await ctx.db.delete(args.id);
    return true;
  },
});

/**
 * Admin mutation to reorder tools.
 */
export const reorderToolsAdmin = mutation({
  args: {
    adminSecret: v.string(),
    orderedIds: v.array(v.id("therapeuticTools")),
  },
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    await ensureSeeded(ctx);

    for (let index = 0; index < args.orderedIds.length; index++) {
      const id = args.orderedIds[index];
      const existing = await ctx.db.get(id);
      if (existing) {
        await ctx.db.patch(id, { order: index + 1 });
      }
    }
    return true;
  },
});
