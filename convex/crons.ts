import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateQuestionnaires = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Expire pending instances that have passed their expiresAt
    const pendingInstances = await ctx.db
      .query("questionnaireInstances")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const instance of pendingInstances) {
      if (instance.expiresAt && instance.expiresAt < now) {
        await ctx.db.patch(instance._id, { status: "expired" });
      }
    }

    // 2. Generate new instances for active assignments
    const activeAssignments = await ctx.db
      .query("questionnaireAssignments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Check if today is Sunday (0 = Sunday in JS Date)
    const isSunday = new Date(now).getUTCDay() === 0;

    for (const assignment of activeAssignments) {
      if (assignment.frequency === "once") {
        // "once" assignments are generated at creation time, skip here
        continue;
      }

      if (assignment.frequency === "onDemand") {
        // On-demand assignments generate the next instance after a submission
        continue;
      }

      if (assignment.frequency === "weekly" && !isSunday) {
        // Weekly assignments only generate on Sundays
        continue;
      }

      // Check if we already generated one for this assignment very recently 
      // (to prevent duplicates if the cron runs twice for some reason)
      const recentInstance = await ctx.db
        .query("questionnaireInstances")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
        .order("desc")
        .first();

      // If it was created in the last 12 hours, skip
      if (recentInstance && now - recentInstance.createdAt < 12 * 60 * 60 * 1000) {
        continue;
      }

      let expiresAt: number;
      if (assignment.frequency === "daily") {
        expiresAt = now + 24 * 60 * 60 * 1000;
      } else {
        // Weekly expires in 7 days
        expiresAt = now + 7 * 24 * 60 * 60 * 1000;
      }

      await ctx.db.insert("questionnaireInstances", {
        assignmentId: assignment._id,
        patientId: assignment.patientId,
        templateId: assignment.templateId,
        status: "pending",
        createdAt: now,
        expiresAt,
      });
    }
  },
});

const crons = cronJobs();

crons.daily(
  "Daily Questionnaire Generation",
  { hourUTC: 8, minuteUTC: 0 },
  internal.crons.generateQuestionnaires
);

export default crons;
