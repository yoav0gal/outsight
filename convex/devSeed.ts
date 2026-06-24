/**
 * Dev-only seed mutations.
 * Run via: npx convex run devSeed:seedLinkPatientHistory
 */
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed synthetic questionnaire history for a specific patient (by name or loginIdentifier).
 * Creates completed instances spread across the past 5 months with scores that show a
 * clear upward then plateau trend — enough to exercise the trend badge and score graph.
 */
export const seedLinkPatientHistory = mutation({
  args: {},
  handler: async (ctx) => {
    // ── 1. Find the target patient ───────────────────────────────────────────
    const allUsers = await ctx.db.query("users").collect();
    const patient = allUsers.find(
      (u) =>
        u.role === "patient" &&
        (u.name === "Link Patient Test" ||
          u.loginIdentifier === "Link Patient Test" ||
          (u.name ?? "").toLowerCase().includes("link patient test"))
    );

    if (!patient) {
      throw new Error('Patient "Link Patient Test" not found. Make sure the patient exists first.');
    }

    // ── 2. Find active assignments for this patient ──────────────────────────
    const assignments = await ctx.db
      .query("questionnaireAssignments")
      .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
      .collect();

    if (assignments.length === 0) {
      throw new Error("No questionnaire assignments found for this patient. Assign at least one questionnaire first.");
    }

    // ── 3. Build timestamps: 6 points spread over the last ~150 days ─────────
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    // Irregular spacing to make the time-axis interesting
    const offsets = [150, 120, 90, 55, 25, 5]; // days ago

    let totalInserted = 0;

    for (const assignment of assignments) {
      // Fetch the template to understand its questions and scoring
      const template = await ctx.db.get(assignment.templateId);
      if (!template) continue;

      const scoringQuestions = template.questions.filter(
        (q) =>
          q.type === "numeric_scale" ||
          q.type === "boolean" ||
          q.type === "multiple_choice" ||
          q.type === "cards"
      );

      // If the template has no scoreable questions, still create submissions
      // but with text answers (so they show in history, just without a score)
      const hasScoringConfig = !!template.scoring;

      // Check how many historical instances already exist
      const existingInstances = await ctx.db
        .query("questionnaireInstances")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
        .collect();

      const completedCount = existingInstances.filter((i) => i.status === "completed").length;
      if (completedCount >= 6) {
        // Already has enough history, skip
        continue;
      }

      // ── 4. Generate answers for each historical point ─────────────────────
      // We want scores to show a trend: low → improving → plateau
      // Score weights (0–1 scale, mapped to each question's range)
      const scoreWeights = [0.2, 0.35, 0.5, 0.65, 0.75, 0.78];

      for (let i = 0; i < offsets.length; i++) {
        const submittedAt = now - offsets[i] * DAY;
        const weight = scoreWeights[i];

        const answers: Array<{ questionId: string; value: string | number | boolean | string[] }> = [];

        for (const question of template.questions) {
          if (question.type === "instructions") continue;

          if (question.type === "numeric_scale" && question.scaleConfig) {
            const { min, max } = question.scaleConfig;
            const value = Math.round(min + weight * (max - min));
            answers.push({ questionId: question.id, value });
          } else if (question.type === "boolean") {
            answers.push({ questionId: question.id, value: weight > 0.4 });
          } else if (
            (question.type === "multiple_choice" || question.type === "cards") &&
            question.options?.length
          ) {
            // Pick an option index proportional to weight
            const optionIndex = Math.min(
              Math.round(weight * (question.options.length - 1)),
              question.options.length - 1
            );
            answers.push({ questionId: question.id, value: question.options[optionIndex] });
          } else if (question.type === "short_text" || question.type === "long_text") {
            const textSamples = [
              "מצבי השתפר מאז הפגישה האחרונה",
              "יש עדיין קשיים אבל אני מתקדם/ת",
              "הרגשתי טוב יותר השבוע",
              "היו כמה ימים קשים אבל בסך הכל בסדר",
              "ממשיך/ת לעבוד על הדברים שדיברנו",
              "הרבה יותר טוב, תודה",
            ];
            answers.push({ questionId: question.id, value: textSamples[i % textSamples.length] });
          }
        }

        if (answers.length === 0 && !hasScoringConfig) continue;

        await ctx.db.insert("questionnaireInstances", {
          assignmentId: assignment._id,
          patientId: patient._id,
          templateId: assignment.templateId,
          status: "completed",
          answers,
          createdAt: submittedAt - 2 * 60 * 1000, // 2 min before submission
          submittedAt,
        });

        totalInserted++;
      }
    }

    return {
      patientId: patient._id,
      patientName: patient.name ?? patient.loginIdentifier,
      assignmentsProcessed: assignments.length,
      instancesInserted: totalInserted,
    };
  },
});
