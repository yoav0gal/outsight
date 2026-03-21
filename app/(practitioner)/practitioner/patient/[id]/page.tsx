"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import {
  ArchiveRestore,
  Activity,
  ArrowLeft,
  ChevronRight,
  BellRing,
  CalendarDays,
  ClipboardPenLine,
  FileText,
  History,
} from "lucide-react";

import { TemplateSearchPicker } from "@/components/practitioner/TemplateSearchPicker";
import { ArchiveNavigationButton } from "@/components/ui/archiveNavigationButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFeedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { resolveLocalizedText } from "@/lib/templateEditor";

type SessionReviewDoc = Doc<"sessionReviews">;

interface SessionReviewFormState {
  sessionDate: string;
  title: string;
  review: string;
}

const EMPTY_SESSION_FORM: SessionReviewFormState = {
  sessionDate: "",
  title: "",
  review: "",
};

function formatDateInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 12).getTime();
}

function buildSessionForm(review?: SessionReviewDoc | null): SessionReviewFormState {
  if (!review) {
    return {
      ...EMPTY_SESSION_FORM,
      sessionDate: formatDateInputValue(Date.now()),
    };
  }

  return {
    sessionDate: formatDateInputValue(review.sessionDate),
    title: review.title ?? "",
    review: review.review,
  };
}

function buildPatientQuestionnaireUrl(
  patientId: Id<"users">,
  searchParams: URLSearchParams,
  questionnairesView: "active" | "archived"
) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", "questionnaires");

  if (questionnairesView === "archived") {
    params.set("questionnairesView", "archived");
  } else {
    params.delete("questionnairesView");
  }

  const query = params.toString();
  return query ? `/practitioner/patient/${patientId}?${query}` : `/practitioner/patient/${patientId}`;
}

function formatCompactDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function formatCompactDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

interface SummaryMetricProps {
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  label: string;
  value: string | number;
}

function SummaryMetric({ icon: Icon, iconClassName, label, value }: SummaryMetricProps) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200/70 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
          <p className="truncate text-sm font-semibold text-zinc-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface SectionShellProps {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

function SectionShell({ title, description, badge, actions, children }: SectionShellProps) {
  return (
    <section className="rounded-[1.75rem] border border-zinc-200/70 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
              {badge}
            </div>
            {description ? <div className="max-w-2xl text-sm leading-6 text-zinc-500">{description}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function PatientDetailsPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("PractitionerPatient");
  const tActions = useTranslations("SharedActions");
  const patientId = params.id as Id<"users">;

  const patient = useQuery(api.users.getPatient, { id: patientId });
  const assignments = useQuery(api.questionnaires.listPatientAssignments, { patientId });
  const templates = useQuery(api.questionnaires.listTemplates);
  const assignableTemplates = useQuery(api.questionnaires.listAssignableTemplates);
  const history = useQuery(api.questionnaires.listPractitionerPatientHistorySummaries, { patientId });
  const sessionHistory = useQuery(api.sessionReviews.listPatientSessionReviews, { patientId });
  const assignMutation = useMutation(api.questionnaires.assign);
  const createSessionReview = useMutation(api.sessionReviews.createSessionReview);
  const updateSessionReview = useMutation(api.sessionReviews.updateSessionReview);
  const unarchiveQuestionnaireAssignment = useMutation(api.questionnaires.unarchiveQuestionnaireAssignment);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"questionnaireTemplates"> | "">("");
  const [selectedFrequency, setSelectedFrequency] = useState<"once" | "daily" | "weekly" | "onDemand">("weekly");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedSessionReview, setSelectedSessionReview] = useState<SessionReviewDoc | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionReviewFormState>(buildSessionForm());
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isRestoringAssignmentId, setIsRestoringAssignmentId] = useState<Id<"questionnaireAssignments"> | null>(null);
  const { showFeedback } = useFeedback();

  const questionnairesView = searchParams.get("questionnairesView") === "archived" ? "archived" : "active";
  const activeAssignments = (assignments ?? []).filter((assignment) => assignment.status === "active");
  const archivedAssignments = (assignments ?? []).filter((assignment) => assignment.status === "archived");
  const assignmentStatusByTemplateId = new Map<
    Id<"questionnaireTemplates">,
    "active" | "archived"
  >();
  for (const assignment of activeAssignments) {
    assignmentStatusByTemplateId.set(assignment.templateId, "active");
  }
  for (const assignment of archivedAssignments) {
    if (!assignmentStatusByTemplateId.has(assignment.templateId)) {
      assignmentStatusByTemplateId.set(assignment.templateId, "archived");
    }
  }
  const clinicTemplateOptions = (assignableTemplates ?? []).map((template) => {
    const assignmentStatus = assignmentStatusByTemplateId.get(template._id);

    return {
      ...template,
      isQuickAccess: template.isQuickAccess,
      source: template.source,
      statusBadge: assignmentStatus
        ? {
            label: t(`questionnaires.status.${assignmentStatus}`),
            tone: assignmentStatus,
          }
        : undefined,
    };
  });
  const selectedTemplateStatus = selectedTemplate ? assignmentStatusByTemplateId.get(selectedTemplate) : undefined;
  const visibleAssignments = questionnairesView === "archived" ? archivedAssignments : activeAssignments;
  const questionnaireViewLabel =
    questionnairesView === "archived" ? t("questionnaires.archivedTitle") : t("questionnaires.active");

  const openCreateSessionDialog = () => {
    setSelectedSessionReview(null);
    setSessionForm(buildSessionForm());
    setSessionError(null);
    setIsSessionDialogOpen(true);
  };

  const openEditSessionDialog = (review: SessionReviewDoc) => {
    setSelectedSessionReview(review);
    setSessionForm(buildSessionForm(review));
    setSessionError(null);
    setIsSessionDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedTemplate) return;
    setIsAssigning(true);
    try {
      const result = await assignMutation({
        patientId,
        templateId: selectedTemplate as Id<"questionnaireTemplates">,
        frequency: selectedFrequency,
      });
      setIsAssignOpen(false);
      setSelectedTemplate("");
      showFeedback({
        variant: "success",
        title: t("questionnaires.assign"),
        description:
          result.action === "restored"
            ? t("questionnaires.assignRestoredSuccess")
            : t("questionnaires.assignSuccess"),
      });
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: t("questionnaires.assign"),
        description:
          error instanceof Error &&
          error.message === "A questionnaire for this template is already active for this patient"
            ? t("questionnaires.assignAlreadyActiveError")
            : t("questionnaires.assignError"),
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveSessionReview = async () => {
    const parsedSessionDate = parseDateInputValue(sessionForm.sessionDate);

    if (!parsedSessionDate) {
      setSessionError(t("history.validation.invalidDate"));
      return;
    }

    if (!sessionForm.review.trim()) {
      setSessionError(t("history.validation.reviewRequired"));
      return;
    }

    setIsSavingSession(true);
    setSessionError(null);

    try {
      const payload = {
        sessionDate: parsedSessionDate,
        title: sessionForm.title,
        review: sessionForm.review,
      };

      if (selectedSessionReview) {
        await updateSessionReview({
          reviewId: selectedSessionReview._id,
          ...payload,
        });
        showFeedback({
          variant: "success",
          title: t("history.success.updated"),
        });
      } else {
        await createSessionReview({
          patientId,
          ...payload,
        });
        showFeedback({
          variant: "success",
          title: t("history.success.created"),
        });
      }

      setIsSessionDialogOpen(false);
      setSelectedSessionReview(null);
      setSessionForm(buildSessionForm());
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        if (error.message === "Review is required") {
          setSessionError(t("history.validation.reviewRequired"));
          return;
        }

        if (error.message === "Invalid session date") {
          setSessionError(t("history.validation.invalidDate"));
          return;
        }
      }

      showFeedback({
        variant: "error",
        title: selectedSessionReview ? t("history.errors.update") : t("history.errors.create"),
      });
    } finally {
      setIsSavingSession(false);
    }
  };

  const goToQuestionnaireView = (view: "active" | "archived") => {
    router.push(buildPatientQuestionnaireUrl(patientId, new URLSearchParams(searchParams.toString()), view));
  };

  const handleRestoreQuestionnaire = async (assignmentId: Id<"questionnaireAssignments">) => {
    setIsRestoringAssignmentId(assignmentId);
    try {
      await unarchiveQuestionnaireAssignment({ assignmentId });
      showFeedback({
        variant: "success",
        title: tActions("success.restored"),
        description: t("questionnaires.restoreSuccess"),
      });
      goToQuestionnaireView("active");
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: tActions("restore"),
        description:
          error instanceof Error &&
          error.message === "A questionnaire for this template is already active for this patient"
            ? t("questionnaires.assignAlreadyActiveError")
            : t("questionnaires.restoreError"),
      });
    } finally {
      setIsRestoringAssignmentId(null);
    }
  };

  const latestSessionLabel = sessionHistory?.latestSessionDate
    ? new Date(sessionHistory.latestSessionDate).toLocaleDateString()
    : t("history.noLastSession");
  const defaultTab = searchParams.get("tab") === "questionnaires" ? "questionnaires" : "history";
  const [mobileTab, setMobileTab] = useState<"history" | "questionnaires">(defaultTab);
  const historyByTemplateId = new Map(
    (history ?? []).map((summary) => [summary.templateId, summary] as const)
  );
  const totalUnreadEntries = (history ?? []).reduce((sum, summary) => sum + (summary.unreadEntries ?? 0), 0);

  useEffect(() => {
    setMobileTab(defaultTab);
  }, [defaultTab]);

  if (patient === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Patient Not Found</h2>
        <Button onClick={() => router.push("/practitioner/my-patients")} variant="outline">
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  const questionnaireActions = (
    <>
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogTrigger
          render={
            <Button size="sm" className="rounded-xl px-4 font-semibold shadow-sm shadow-indigo-100">
              <FileText className="me-2 h-4 w-4" />
              {tActions("add")}
            </Button>
          }
        />
        <DialogContent className="w-[min(42rem,calc(100vw-1rem))] max-w-[min(42rem,calc(100vw-1rem))] rounded-2xl sm:w-[min(48rem,calc(100vw-2rem))] sm:max-w-[min(48rem,calc(100vw-2rem))]">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("assignModal.title")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template" className="text-sm font-semibold">
                {t("assignModal.questionnaire")}
              </Label>
              <TemplateSearchPicker
                options={clinicTemplateOptions}
                value={selectedTemplate}
                onChange={(value) => setSelectedTemplate(value as Id<"questionnaireTemplates">)}
                placeholder={t("assignModal.selectQuestionnaire")}
                searchPlaceholder={t("assignModal.searchTemplate")}
                emptyLabel={t("assignModal.noTemplates")}
                title={t("assignModal.title")}
                quickAccessLabel={t("assignModal.quickAccess")}
                systemLabel={t("assignModal.system")}
                customLabel={t("assignModal.custom")}
              />
              {selectedTemplateStatus === "active" ? (
                <p className="text-sm text-red-600">{t("assignModal.alreadyActive")}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frequency" className="text-sm font-semibold">
                {t("assignModal.frequency")}
              </Label>
              <Select
                value={selectedFrequency}
                onValueChange={(val) => setSelectedFrequency(val as "once" | "daily" | "weekly" | "onDemand")}
              >
                <SelectTrigger id="frequency" className="h-12 rounded-lg border-zinc-200">
                  <SelectValue>{(value: string) => (value ? t(`questionnaires.frequency.${value}`) : "")}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {(["once", "daily", "weekly", "onDemand"] as const).map((freq) => (
                    <SelectItem key={freq} value={freq} className="rounded-lg">
                      {t(`questionnaires.frequency.${freq}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="rounded-xl">
              {t("assignModal.cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedTemplate || selectedTemplateStatus === "active" || isAssigning}
              className="rounded-xl"
            >
              {isAssigning ? "..." : t("assignModal.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  const historySection = (
    <SectionShell
      title={t("history.sessionsLabel")}
      badge={
        sessionHistory && sessionHistory.totalSessions > 0 ? (
          <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
            {sessionHistory.totalSessions}
          </Badge>
        ) : undefined
      }
      actions={
        <Button size="sm" className="rounded-xl px-4 font-semibold shadow-sm shadow-indigo-100" onClick={openCreateSessionDialog}>
          <ClipboardPenLine className="me-2 h-4 w-4" />
          {tActions("add")}
        </Button>
      }
    >
      {!sessionHistory ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="rounded-[1.5rem] border-zinc-100 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="h-3 w-24 animate-pulse rounded-md bg-zinc-100"></div>
                <div className="h-4 w-40 animate-pulse rounded-md bg-zinc-100"></div>
                <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-100"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessionHistory.reviews.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50/80 px-5 py-12 text-center">
          <History className="mx-auto mb-4 h-9 w-9 text-zinc-300" />
          <h3 className="mb-2 text-lg font-bold text-zinc-900">{t("history.emptyTitle")}</h3>
          <p className="mx-auto mb-5 max-w-xl text-sm leading-6 text-zinc-500">{t("history.emptyDescription")}</p>
          <Button className="rounded-xl font-semibold" onClick={openCreateSessionDialog}>
            {t("history.addFirst")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionHistory.reviews.map((review) => (
            <article
              key={review._id}
              className="group cursor-pointer rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/40 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
              onClick={() => openEditSessionDialog(review)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <h3 className="line-clamp-1 text-base font-bold text-zinc-950">
                    {review.title?.trim() || t("history.untitled")}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500">
                    {formatCompactDate(review.sessionDate)}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors group-hover:text-zinc-700">
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );

  const questionnairesSection = (
    <SectionShell
      title={questionnairesView === "archived" ? questionnaireViewLabel : t("questionnaires.active")}
      badge={<Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">{visibleAssignments.length}</Badge>}
      description={
        <ArchiveNavigationButton
          archived={questionnairesView === "archived"}
          archivedLabel={
            archivedAssignments.length > 0
              ? `${tActions("archived")} (${archivedAssignments.length})`
              : tActions("archived")
          }
          activeLabel={tActions("backToActive")}
          onClick={() => goToQuestionnaireView(questionnairesView === "archived" ? "active" : "archived")}
        />
      }
      actions={questionnaireActions}
    >
      {!assignments ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-[1.5rem] border-zinc-100 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-1/3 animate-pulse rounded-md bg-zinc-100"></div>
                <div className="h-3 w-2/3 animate-pulse rounded-md bg-zinc-100"></div>
                <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-100"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : visibleAssignments.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50/80 px-5 py-12 text-center">
          <FileText className="mx-auto mb-3 h-9 w-9 text-zinc-300" />
          <p className="font-medium text-zinc-500">
            {questionnairesView === "archived" ? t("questionnaires.noArchived") : t("questionnaires.noActive")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAssignments.map((assignment) => {
            const tpl = templates?.find((template) => template._id === assignment.templateId);
            const summary = historyByTemplateId.get(assignment.templateId);
            const metaLabel = summary?.lastEntryAt
              ? t("questionnaires.lastAdded", {
                  date: new Date(summary.lastEntryAt).toLocaleString(),
                })
              : t("questionnaires.noResponsesYet");
            const lastScoreLabel = summary?.latestScore
              ? summary.latestScore.max === null
                ? t("questionnaires.score", { value: summary.latestScore.value })
                : t("questionnaires.scoreWithMax", {
                    value: summary.latestScore.value,
                    max: summary.latestScore.max,
                  })
              : t("questionnaires.noScoreYet");

            return (
              <Card
                key={assignment._id}
                className={`group cursor-pointer rounded-[1.5rem] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  assignment.status === "archived"
                    ? "border-amber-200/70 bg-amber-50/50"
                    : "border-zinc-200/80 bg-white"
                }`}
                onClick={() =>
                  router.push(`/practitioner/patient/${patientId}/questionnaire-history/${assignment.templateId}`)
                }
              >
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start gap-2">
                        <h3 className="line-clamp-1 text-base font-bold text-zinc-900">
                          {tpl
                            ? resolveLocalizedText(locale, tpl.title, tpl.titleTranslations)
                            : "Loading..."}
                        </h3>
                        {summary ? (
                          <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                            {t("questionnaires.entriesCount", { count: summary.totalEntries })}
                          </Badge>
                        ) : null}
                        {summary?.unreadEntries ? (
                          <Badge className="rounded-full border-none bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-800 hover:bg-amber-100">
                            <BellRing className="me-1 h-3 w-3" />
                            {t("questionnaires.newEntries", { count: summary.unreadEntries })}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span title={t("questionnaires.lastAddedIndicator")}>
                          <CalendarDays className="h-4 w-4 text-zinc-400" />
                        </span>
                        <span>{summary?.lastEntryAt ? formatCompactDateTime(summary.lastEntryAt) : metaLabel}</span>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Activity className="h-4 w-4" />
                        </div>
                        <p className="truncate text-sm font-semibold text-zinc-700">{lastScoreLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-stretch">
                    {assignment.status === "archived" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-zinc-200"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRestoreQuestionnaire(assignment._id);
                        }}
                        disabled={isRestoringAssignmentId === assignment._id}
                      >
                        <ArchiveRestore className="me-2 h-4 w-4" />
                        {isRestoringAssignmentId === assignment._id
                          ? t("questionnaires.restoring")
                          : t("questionnaires.restorePrescription")}
                      </Button>
                    ) : null}
                    <div className="flex flex-1 items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors group-hover:text-zinc-700">
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </SectionShell>
  );

  return (
    <main className="mx-auto flex-1 w-full max-w-6xl p-4 sm:p-8 lg:p-10">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/practitioner/my-patients")}
          className="-ms-4 flex w-fit items-center gap-2 text-zinc-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToDashboard")}
        </Button>

        <div className="rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(244,244,245,0.65))] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-indigo-50 text-2xl font-black text-indigo-600 shadow-inner sm:h-18 sm:w-18">
                {patient.name?.charAt(0) || "P"}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  {patient.name || t("unnamed")}
                </h1>
                <p className="truncate text-sm font-medium text-zinc-500 sm:text-base">{patient.email}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <SummaryMetric
                icon={CalendarDays}
                iconClassName="bg-emerald-50 text-emerald-600"
                label={t("history.lastSession")}
                value={latestSessionLabel}
              />
              <SummaryMetric
                icon={BellRing}
                iconClassName="bg-amber-50 text-amber-700"
                label={t("questionnaires.newEntriesLabel")}
                value={totalUnreadEntries}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)] lg:items-start">
        <div>{questionnairesSection}</div>
        <div>{historySection}</div>
      </div>

      <Tabs value={mobileTab} onValueChange={(value) => setMobileTab(value as "history" | "questionnaires")} dir="auto" className="w-full lg:hidden">
        <TabsList className="mb-5 inline-flex w-full overflow-x-auto rounded-xl bg-zinc-100 p-1.5">
          <TabsTrigger
            value="history"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <History className="h-4 w-4 opacity-70" /> {t("tabs.history")}
          </TabsTrigger>
          <TabsTrigger
            value="questionnaires"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4 opacity-70" /> {t("tabs.questionnaires")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {historySection}
        </TabsContent>

        <TabsContent value="questionnaires" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {questionnairesSection}
        </TabsContent>
      </Tabs>

      <Dialog
        open={isSessionDialogOpen}
        onOpenChange={(open) => {
          setIsSessionDialogOpen(open);
          if (!open) {
            setSelectedSessionReview(null);
            setSessionError(null);
          }
        }}
      >
        <DialogContent className="rounded-[2rem] border-none bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-0 shadow-2xl sm:max-w-[640px]">
          <div className="rounded-[2rem] border border-zinc-100/80 p-8 sm:p-10">
            <DialogHeader className="space-y-3 text-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ClipboardPenLine className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-950">
                {selectedSessionReview ? t("history.editTitle") : t("history.add")}
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-6 text-zinc-600">
                {t("history.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="sessionDate" className="text-sm font-semibold text-zinc-800">
                  {t("history.sessionDate")}
                </Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, sessionDate: event.target.value }))
                  }
                  className="h-11 rounded-xl border-zinc-200 bg-white px-3 text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sessionTitle" className="text-sm font-semibold text-zinc-800">
                  {t("history.sessionTitle")}
                </Label>
                <Input
                  id="sessionTitle"
                  value={sessionForm.title}
                  maxLength={120}
                  placeholder={t("history.sessionTitlePlaceholder")}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="h-11 rounded-xl border-zinc-200 bg-white px-3 text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sessionReview" className="text-sm font-semibold text-zinc-800">
                  {t("history.review")}
                </Label>
                <Textarea
                  id="sessionReview"
                  value={sessionForm.review}
                  maxLength={10000}
                  placeholder={t("history.reviewPlaceholder")}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, review: event.target.value }))
                  }
                  className="min-h-44 rounded-2xl border-zinc-200 bg-white px-4 py-3 text-sm leading-6"
                />
              </div>

              {sessionError ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {sessionError}
                </p>
              ) : null}
            </div>

            <DialogFooter className="mt-8 gap-3 sm:justify-between">
              <Button
                variant="ghost"
                className="rounded-xl text-zinc-600"
                onClick={() => setIsSessionDialogOpen(false)}
              >
                {t("history.cancel")}
              </Button>
              <Button
                onClick={handleSaveSessionReview}
                disabled={isSavingSession}
                className="rounded-xl px-6 font-bold shadow-md shadow-indigo-100"
              >
                {isSavingSession ? t("history.saving") : t("history.save")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
