"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  BellRing,
  CalendarDays,
  ClipboardPenLine,
  FileText,
  History,
} from "lucide-react";

import { TemplateSearchPicker } from "@/components/practitioner/TemplateSearchPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("PractitionerPatient");
  const patientId = params.id as Id<"users">;

  const patient = useQuery(api.users.getPatient, { id: patientId });
  const assignments = useQuery(api.questionnaires.listPatientAssignments, { patientId });
  const templates = useQuery(api.questionnaires.listTemplates);
  const clinicTemplates = useQuery(api.questionnaires.listClinicTemplates);
  const history = useQuery(api.questionnaires.listPractitionerPatientHistorySummaries, { patientId });
  const sessionHistory = useQuery(api.sessionReviews.listPatientSessionReviews, { patientId });
  const assignMutation = useMutation(api.questionnaires.assign);
  const createSessionReview = useMutation(api.sessionReviews.createSessionReview);
  const updateSessionReview = useMutation(api.sessionReviews.updateSessionReview);
  const unarchiveQuestionnaireAssignment = useMutation(api.questionnaires.unarchiveQuestionnaireAssignment);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"questionnaireTemplates"> | "">("");
  const [selectedFrequency, setSelectedFrequency] = useState<"once" | "daily" | "weekly">("weekly");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedSessionReview, setSelectedSessionReview] = useState<SessionReviewDoc | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionReviewFormState>(buildSessionForm());
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isRestoringAssignmentId, setIsRestoringAssignmentId] = useState<Id<"questionnaireAssignments"> | null>(null);

  const questionnairesView = searchParams.get("questionnairesView") === "archived" ? "archived" : "active";
  const activeAssignments = (assignments ?? []).filter((assignment) => assignment.status === "active");
  const archivedAssignments = (assignments ?? []).filter((assignment) => assignment.status === "archived");
  const visibleAssignments = questionnairesView === "archived" ? archivedAssignments : activeAssignments;
  const questionnaireViewLabel =
    questionnairesView === "archived" ? t("questionnaires.archivedTitle") : t("questionnaires.active");
  const questionnaireViewDescription =
    questionnairesView === "archived"
      ? t("questionnaires.archivedDescription")
      : t("questionnaires.activeDescription");

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
      await assignMutation({
        patientId,
        templateId: selectedTemplate as Id<"questionnaireTemplates">,
        frequency: selectedFrequency,
      });
      setIsAssignOpen(false);
      setSelectedTemplate("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign questionnaire.");
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
        alert(t("history.success.updated"));
      } else {
        await createSessionReview({
          patientId,
          ...payload,
        });
        alert(t("history.success.created"));
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

      alert(selectedSessionReview ? t("history.errors.update") : t("history.errors.create"));
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
      goToQuestionnaireView("active");
    } catch (error) {
      console.error(error);
      alert(t("questionnaires.restoreError"));
    } finally {
      setIsRestoringAssignmentId(null);
    }
  };

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
        <Button onClick={() => router.back()} variant="outline">
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  const latestSessionLabel = sessionHistory?.latestSessionDate
    ? new Date(sessionHistory.latestSessionDate).toLocaleDateString()
    : t("history.noLastSession");
  const defaultTab = searchParams.get("tab") === "questionnaires" ? "questionnaires" : "history";
  const historyByTemplateId = new Map(
    (history ?? []).map((summary) => [summary.templateId, summary] as const)
  );

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-6 sm:p-10">
      <div className="mb-8 flex flex-col gap-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="-ms-4 flex w-fit items-center gap-2 text-zinc-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToDashboard")}
        </Button>

        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-3xl font-black text-indigo-600 shadow-inner sm:h-24 sm:w-24">
            {patient.name?.charAt(0) || "P"}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
              {patient.name || t("unnamed")}
            </h1>
            <p className="text-lg font-medium text-zinc-500">{patient.email}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} dir="auto" className="w-full">
        <TabsList className="mb-8 inline-flex w-full overflow-x-auto rounded-xl bg-zinc-100 p-1.5 sm:w-auto">
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
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
              <Card className="overflow-hidden rounded-2xl border-zinc-200/60 shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <ClipboardPenLine className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-500">{t("history.totalSessions")}</p>
                    <p className="text-2xl font-bold tracking-tight text-zinc-950">
                      {sessionHistory ? sessionHistory.totalSessions : "..."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-2xl border-zinc-200/60 shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-500">{t("history.lastSession")}</p>
                    <p className="text-lg font-bold tracking-tight text-zinc-950">{latestSessionLabel}</p>
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="h-auto rounded-2xl px-6 py-4 font-bold shadow-md shadow-indigo-100"
                onClick={openCreateSessionDialog}
              >
                <ClipboardPenLine className="me-2 h-5 w-5" />
                {t("history.add")}
              </Button>
            </div>

            <Card className="overflow-hidden rounded-[2rem] border-zinc-200/60 shadow-sm">
              <CardHeader className="border-b border-zinc-100 bg-[linear-gradient(135deg,rgba(238,242,255,0.9),rgba(255,255,255,1))]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-zinc-950">{t("history.title")}</CardTitle>
                    <p className="max-w-2xl text-sm text-zinc-600">{t("history.description")}</p>
                  </div>
                  {sessionHistory && sessionHistory.totalSessions > 0 ? (
                    <Badge variant="secondary" className="w-fit rounded-full bg-white/90 px-3 py-1 text-zinc-700 shadow-sm">
                      {sessionHistory.totalSessions} {t("history.sessionsLabel")}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                {!sessionHistory ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Card key={index} className="rounded-2xl border-zinc-100 shadow-sm">
                        <CardContent className="space-y-4 p-6">
                          <div className="h-4 w-1/3 animate-pulse rounded-md bg-zinc-100"></div>
                          <div className="h-5 w-2/3 animate-pulse rounded-md bg-zinc-100"></div>
                          <div className="h-16 w-full animate-pulse rounded-2xl bg-zinc-100"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : sessionHistory.reviews.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center">
                    <History className="mx-auto mb-4 h-10 w-10 text-zinc-300" />
                    <h3 className="mb-2 text-xl font-bold text-zinc-900">{t("history.emptyTitle")}</h3>
                    <p className="mx-auto mb-6 max-w-xl text-sm leading-6 text-zinc-500">
                      {t("history.emptyDescription")}
                    </p>
                    <Button className="rounded-xl font-bold" onClick={openCreateSessionDialog}>
                      {t("history.addFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionHistory.reviews.map((review) => (
                      <article
                        key={review._id}
                        className="rounded-[1.75rem] border border-zinc-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700">
                                {t("history.sessionNumber", { number: review.sessionNumber })}
                              </Badge>
                              <span className="text-sm font-medium text-zinc-500">
                                {new Date(review.sessionDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-bold text-zinc-950">
                                {review.title?.trim() || t("history.untitled")}
                              </h3>
                              <p className="line-clamp-4 max-w-3xl text-sm leading-6 text-zinc-600">
                                {review.review}
                              </p>
                            </div>
                            {review.updatedAt !== review.createdAt ? (
                              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                                {t("history.updatedAt", {
                                  date: new Date(review.updatedAt).toLocaleDateString(),
                                })}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            variant="outline"
                            className="shrink-0 rounded-xl border-zinc-200"
                            onClick={() => openEditSessionDialog(review)}
                          >
                            {t("history.edit")}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questionnaires" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-zinc-200/60 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-zinc-900">{questionnaireViewLabel}</h2>
                  <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                    {visibleAssignments.length} {questionnairesView === "archived" ? t("questionnaires.archivedBadge") : t("questionnaires.activeBadge")}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-zinc-500">{questionnaireViewDescription}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl border-zinc-200 text-zinc-600 hover:text-zinc-950"
                  onClick={() => goToQuestionnaireView(questionnairesView === "archived" ? "active" : "archived")}
                  aria-label={
                    questionnairesView === "archived"
                      ? t("questionnaires.returnToActive")
                      : t("questionnaires.openArchived")
                  }
                >
                  {questionnairesView === "archived" ? (
                    <ArchiveRestore className="size-4" />
                  ) : (
                    <Archive className="size-4" />
                  )}
                </Button>

                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                  <DialogTrigger
                    render={
                      <Button size="lg" className="rounded-xl font-bold shadow-md shadow-indigo-100">
                        <FileText className="me-2 h-5 w-5" />
                        {t("questionnaires.assign")}
                      </Button>
                    }
                  />
                  <DialogContent className="rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{t("assignModal.title")}</DialogTitle>
                      <DialogDescription>{t("assignModal.description")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="template" className="text-sm font-semibold">
                          {t("assignModal.template")}
                        </Label>
                        <TemplateSearchPicker
                          options={clinicTemplates ?? []}
                          value={selectedTemplate}
                          onChange={(value) => setSelectedTemplate(value as Id<"questionnaireTemplates">)}
                          placeholder={t("assignModal.selectTemplate")}
                          searchPlaceholder={t("assignModal.searchTemplate")}
                          emptyLabel={t("assignModal.noTemplates")}
                          title={t("assignModal.title")}
                          description={t("assignModal.searchDescription")}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="frequency" className="text-sm font-semibold">
                          {t("assignModal.frequency")}
                        </Label>
                        <Select
                          value={selectedFrequency}
                          onValueChange={(val) => setSelectedFrequency(val as "once" | "daily" | "weekly")}
                        >
                          <SelectTrigger id="frequency" className="h-12 rounded-lg border-zinc-200">
                            <SelectValue>{(value: string) => (value ? t(`questionnaires.frequency.${value}`) : "")}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {(["once", "daily", "weekly"] as const).map((freq) => (
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
                      <Button onClick={handleAssign} disabled={!selectedTemplate || isAssigning} className="rounded-xl">
                        {isAssigning ? "..." : t("assignModal.submit")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!assignments ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border-zinc-100 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="h-5 w-2/3 animate-pulse rounded-md bg-zinc-100"></div>
                    <div className="h-4 w-1/3 animate-pulse rounded-md bg-zinc-100"></div>
                  </CardContent>
                </Card>
              ))
            ) : visibleAssignments.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-zinc-200 bg-white py-16 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                <p className="font-medium text-zinc-500">
                  {questionnairesView === "archived"
                    ? t("questionnaires.noArchived")
                    : t("questionnaires.noActive")}
                </p>
              </div>
            ) : (
              visibleAssignments.map((assignment) => {
                const tpl = templates?.find((template) => template._id === assignment.templateId);
                const summary = historyByTemplateId.get(assignment.templateId);
                const metaLabel = summary?.lastEntryAt
                  ? t("questionnaires.lastAdded", {
                      date: new Date(summary.lastEntryAt).toLocaleString(),
                    })
                  : t("questionnaires.noResponsesYet");
                return (
                  <Card
                    key={assignment._id}
                    className="cursor-pointer rounded-2xl border-zinc-200/60 shadow-sm transition-shadow hover:shadow-md"
                    onClick={() =>
                      router.push(
                        `/practitioner/patient/${patientId}/questionnaire-history/${assignment.templateId}`
                      )
                    }
                  >
                    <CardContent className="flex flex-col items-start gap-4 p-6">
                      <div className="w-full space-y-1 text-start">
                        <div className="flex items-center gap-2">
                          <h4 className="line-clamp-1 font-bold text-zinc-900">{tpl?.title || "Loading..."}</h4>
                          {summary?.unreadEntries ? (
                            <Badge className="rounded-full border-none bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-800 hover:bg-amber-100">
                              <BellRing className="me-1 h-3 w-3" />
                              {t("questionnaires.newEntries", { count: summary.unreadEntries })}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-sm text-zinc-500">{tpl?.description}</p>
                        <p className="pt-1 text-sm font-medium text-zinc-500">{metaLabel}</p>
                      </div>
                      <div className="mt-auto flex w-full items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`rounded-lg capitalize ${
                            assignment.status === "archived"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          {t(`questionnaires.status.${assignment.status}`)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="ms-auto rounded-lg border-green-200 capitalize text-green-700"
                        >
                          {t(`questionnaires.status.${assignment.status}`)}
                        </Badge>
                        {assignment.status === "archived" ? (
                          <Button
                            type="button"
                            variant="outline"
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
                        {summary ? (
                          <Badge variant="secondary" className="rounded-lg bg-zinc-100 text-zinc-700">
                            {t("questionnaires.entriesCount", { count: summary.totalEntries })}
                          </Badge>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
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
