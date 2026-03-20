"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  BellRing,
  Calendar,
  ChevronRight,
  FileText,
  History,
  Trash2,
} from "lucide-react";

import { QuestionnaireScoreTrend } from "@/components/practitioner/QuestionnaireScoreTrend";
import { QuestionnairePreview } from "@/components/QuestionnairePreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ScoreSummary = {
  mode: "standard";
  value: number;
  max: number | null;
  answeredQuestions: number;
  totalQuestions: number;
};

type HistoryInstance = Doc<"questionnaireInstances"> & {
  score?: ScoreSummary | null;
};
type AssignmentDoc = Doc<"questionnaireAssignments">;

function formatScoreLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  score: ScoreSummary | null | undefined
) {
  if (!score) return null;

  return score.max === null
    ? t("questionnaires.score", { value: score.value })
    : t("questionnaires.scoreWithMax", { value: score.value, max: score.max });
}

export default function PractitionerPatientQuestionnaireHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("PractitionerPatient");
  const tQ = useTranslations("Questionnaire");
  const patientId = params.id as Id<"users">;
  const templateId = params.templateId as Id<"questionnaireTemplates">;
  const [selectedSubmission, setSelectedSubmission] = useState<HistoryInstance | null>(null);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const patient = useQuery(api.users.getPatient, { id: patientId });
  const templateHistory = useQuery(api.questionnaires.listPractitionerPatientTemplateHistory, {
    patientId,
    templateId,
  });
  const markViewed = useMutation(api.questionnaires.markPractitionerPatientTemplateHistoryViewed);
  const archiveQuestionnaireAssignment = useMutation(api.questionnaires.archiveQuestionnaireAssignment);
  const unarchiveQuestionnaireAssignment = useMutation(api.questionnaires.unarchiveQuestionnaireAssignment);
  const deleteQuestionnaireAssignment = useMutation(api.questionnaires.deleteQuestionnaireAssignment);

  useEffect(() => {
    if (!templateHistory?.lastEntryAt || !templateHistory.unreadEntries) return;

    void markViewed({
      patientId,
      templateId,
      viewedThroughAt: templateHistory.lastEntryAt,
    });
  }, [markViewed, patientId, templateHistory?.lastEntryAt, templateHistory?.unreadEntries, templateId]);

  const goToQuestionnairesView = (view: "active" | "archived") => {
    const url =
      view === "archived"
        ? `/practitioner/patient/${patientId}?tab=questionnaires&questionnairesView=archived`
        : `/practitioner/patient/${patientId}?tab=questionnaires`;
    router.push(url);
  };

  const handleArchivePrescription = async () => {
    if (!assignment) return;

    setIsArchiving(true);
    try {
      await archiveQuestionnaireAssignment({ assignmentId: assignment._id });
      goToQuestionnairesView("archived");
    } catch (error) {
      console.error(error);
      alert(t("questionnaires.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestorePrescription = async () => {
    if (!assignment) return;

    setIsRestoring(true);
    try {
      await unarchiveQuestionnaireAssignment({ assignmentId: assignment._id });
      goToQuestionnairesView("active");
    } catch (error) {
      console.error(error);
      alert(t("questionnaires.restoreError"));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeletePrescription = async () => {
    if (!assignment) return;

    setIsDeleting(true);
    try {
      await deleteQuestionnaireAssignment({ assignmentId: assignment._id });
      setIsDeleteDialogOpen(false);
      goToQuestionnairesView(assignment.status === "archived" ? "archived" : "active");
    } catch (error) {
      console.error(error);
      alert(t("questionnaires.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedSubmissionScoreLabel = formatScoreLabel(t, selectedSubmission?.score);

  if (patient === undefined || templateHistory === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </main>
    );
  }

  const assignment = (templateHistory as { assignment?: AssignmentDoc | null }).assignment;
  const hasHistory = templateHistory.history.length > 0;
  const scoreTrendPoints = templateHistory.history
    .filter((instance) => instance.score)
    .map((instance, index) => {
      const timestamp = instance.submittedAt ?? instance.expiresAt ?? instance.createdAt;
      return {
        id: instance._id,
        label: String(index + 1),
        timestamp,
        score: {
          value: instance.score!.value,
          max: instance.score!.max,
        },
      };
    })
    .reverse();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:p-10">
      <Button
        variant="ghost"
        onClick={() => router.push(`/practitioner/patient/${patientId}?tab=questionnaires`)}
        className="-ms-4 flex w-fit items-center gap-2 text-zinc-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("backToDashboard")}
      </Button>

      <header className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <History className="h-6 w-6" />
          </div>
          {templateHistory.unreadEntries ? (
            <Badge className="rounded-full border-none bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800 hover:bg-amber-100">
              {t("questionnaires.newEntries", { count: templateHistory.unreadEntries })}
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
          {templateHistory.template?.title ?? t("questionnaires.history")}
        </h1>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          {patient?.name || t("unnamed")} · {patient?.email}
        </p>
        {templateHistory.lastEntryAt ? (
          <p className="mt-4 text-sm font-semibold text-zinc-600">
            {t("questionnaires.lastAdded", {
              date: new Date(templateHistory.lastEntryAt).toLocaleString(),
            })}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button className="rounded-xl font-bold" onClick={() => setIsPrescriptionOpen(true)}>
            <FileText className="me-2 h-4 w-4" />
            {t("questionnaires.viewPrescription")}
          </Button>

          {assignment?.status === "archived" ? (
            <Button
              variant="outline"
              className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              onClick={handleRestorePrescription}
              disabled={isRestoring}
            >
              <ArchiveRestore className="me-2 h-4 w-4" />
              {isRestoring ? t("questionnaires.restoring") : t("questionnaires.restorePrescription")}
            </Button>
          ) : assignment ? (
            <Button
              variant="outline"
              className="rounded-xl border-zinc-200 text-zinc-600"
              onClick={handleArchivePrescription}
              disabled={isArchiving}
            >
              <Archive className="me-2 h-4 w-4" />
              {isArchiving ? t("questionnaires.archiving") : t("questionnaires.archivePrescription")}
            </Button>
          ) : null}

          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting || !assignment}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {isDeleting ? t("questionnaires.deleting") : t("questionnaires.deletePrescription")}
          </Button>

          <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
            {t("questionnaires.entriesCount", { count: templateHistory.history.length })}
          </Badge>
        </div>
      </header>

      <QuestionnaireScoreTrend points={scoreTrendPoints} />

      {!templateHistory.history.length ? (
        <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white py-20 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <p className="font-medium text-zinc-500">{t("questionnaires.noHistory")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {templateHistory.history.map((instance, index) => {
            const historyAt = instance.submittedAt ?? instance.expiresAt ?? instance.createdAt;
            return (
              <Card
                key={instance._id}
                className="cursor-pointer overflow-hidden rounded-[2rem] border-zinc-200/70 shadow-sm transition-shadow hover:shadow-md"
                onClick={() => setSelectedSubmission(instance)}
              >
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full bg-zinc-100 text-zinc-700">
                        {t("questionnaires.historyEntryTitle", {
                          number: templateHistory.history.length - index,
                        })}
                      </Badge>
                      {index === 0 && templateHistory.unreadEntries ? (
                        <Badge className="rounded-full border-none bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-800 hover:bg-amber-100">
                          <BellRing className="me-1 h-3 w-3" />
                          {t("questionnaires.newEntries", { count: templateHistory.unreadEntries })}
                        </Badge>
                      ) : null}
                    </div>
                    <CardTitle className="text-lg text-zinc-950">
                      {t("questionnaires.answersCount", { count: instance.answers?.length ?? 0 })}
                    </CardTitle>
                    {formatScoreLabel(t, instance.score) ? (
                      <p className="text-sm font-semibold text-indigo-700">
                        {formatScoreLabel(t, instance.score)}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(historyAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`w-fit rounded-full border-none px-3 py-1 ${
                        instance.status === "completed"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {t(`questionnaires.status.${instance.status}`)}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-zinc-300 rtl:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-[700px]">
          {templateHistory.template ? (
            <div className="bg-zinc-50/30 p-8 sm:p-12">
              <QuestionnairePreview
                questions={templateHistory.template.questions}
                title={templateHistory.template.title}
                description={templateHistory.template.description}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-[520px]">
          <div className="rounded-[2rem] border border-zinc-100 bg-white p-8 sm:p-10">
            <DialogHeader className="space-y-3 text-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-950">
                {hasHistory
                  ? t("questionnaires.deleteConfirmTitleWithHistory")
                  : t("questionnaires.deleteConfirmTitle")}
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-6 text-zinc-600">
                {hasHistory
                  ? t("questionnaires.deleteConfirmDescriptionWithHistory", {
                      count: templateHistory.history.length,
                    })
                  : t("questionnaires.deleteConfirmDescription")}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-8 gap-3 sm:justify-between">
              <Button variant="ghost" className="rounded-xl text-zinc-600" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("questionnaires.cancelDelete")}
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                {hasHistory ? (
                  <Button
                    variant="outline"
                    className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    onClick={handleArchivePrescription}
                    disabled={isArchiving}
                  >
                    <Archive className="me-2 h-4 w-4" />
                    {isArchiving ? t("questionnaires.archiving") : t("questionnaires.archiveInstead")}
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  className="rounded-xl px-6 font-bold"
                  onClick={handleDeletePrescription}
                  disabled={isDeleting}
                >
                  {isDeleting ? t("questionnaires.deleting") : t("questionnaires.confirmDelete")}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-[700px]">
          {selectedSubmission ? (
            <div className="bg-zinc-50/30 p-8 sm:p-12">
              <header className="mb-12 text-center sm:text-start">
                <Badge
                  className={`mb-4 border-none ${
                    selectedSubmission.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {t(`questionnaires.status.${selectedSubmission.status}`)}
                </Badge>
                <h2 className="mb-2 text-4xl font-black tracking-tight text-zinc-950">
                  {templateHistory.template?.title}
                </h2>
                <p className="font-medium text-zinc-500">
                  {tQ("submittedOn", {
                    date: new Date(
                      selectedSubmission.submittedAt ?? selectedSubmission.createdAt
                    ).toLocaleString(),
                  })}
                </p>
                {selectedSubmissionScoreLabel ? (
                  <p className="mt-3 text-sm font-semibold text-indigo-700">
                    {selectedSubmissionScoreLabel}
                  </p>
                ) : null}
              </header>

              <QuestionnairePreview
                questions={templateHistory.template?.questions ?? []}
                answers={Object.fromEntries(
                  (selectedSubmission.answers ?? []).map((answer) => [
                    answer.questionId,
                    answer.value,
                  ])
                )}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
