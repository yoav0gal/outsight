"use client";

import { useState } from "react";
import {
  Archive,
  Loader2,
  PencilLine,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuestionnairePreview } from "@/components/QuestionnairePreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DestructiveActionDialog } from "@/components/ui/destructiveActionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFeedback } from "@/components/ui/feedback";

interface TemplateDialogTemplate {
  _id: Id<"questionnaireTemplates">;
  title: string;
  description?: string;
  source: "system" | "practitioner";
  isInClinic?: boolean;
  isQuickAccess?: boolean;
  archivedAt?: number;
  questions: Array<{
    id: string;
    prompt: string;
    type: string;
    required?: boolean;
    options?: string[];
    scaleConfig?: {
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
    };
  }>;
}

interface QuestionnaireTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateDialogTemplate | null;
  context: "explorer" | "archived";
}

export function QuestionnaireTemplateDialog({
  open,
  onOpenChange,
  template,
  context,
}: QuestionnaireTemplateDialogProps) {
  const router = useRouter();
  const t = useTranslations("PractitionerQuestionnaires");
  const tActions = useTranslations("SharedActions");
  const pinTemplateToQuickAccess = useMutation(api.questionnaires.pinTemplateToQuickAccess);
  const unpinTemplateFromQuickAccess = useMutation(api.questionnaires.unpinTemplateFromQuickAccess);
  const deleteTemplate = useMutation(api.questionnaires.deleteTemplate);
  const createEditableTemplateCopy = useMutation(api.questionnaires.createEditableTemplateCopy);
  const archiveTemplate = useMutation(api.questionnaires.archiveTemplate);
  const unarchiveTemplate = useMutation(api.questionnaires.unarchiveTemplate);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isUnpinning, setIsUnpinning] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { showFeedback } = useFeedback();

  const canDeleteTemplate = template?.source === "practitioner";
  const canArchiveTemplate = template?.source === "practitioner" && !template?.archivedAt;
  const canRestoreTemplate = template?.source === "practitioner" && !!template?.archivedAt;
  const canPinQuickAccess = !!template && !template.archivedAt && !template.isQuickAccess;
  const canUnpinQuickAccess = !!template?.isQuickAccess && !template.archivedAt;

  async function handlePinQuickAccess() {
    if (!template) return;
    setIsPinning(true);
    try {
      await pinTemplateToQuickAccess({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      onOpenChange(false);
      showFeedback({
        variant: "success",
        title: t("preview.quickAccess"),
        description: t("preview.quickAccessSuccess"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: t("preview.saveToQuickAccess"),
        description:
          error instanceof Error && error.message ? error.message : tActions("errors.generic"),
      });
    } finally {
      setIsPinning(false);
    }
  }

  async function handleUnpinQuickAccess() {
    if (!template) return;
    setIsUnpinning(true);
    try {
      await unpinTemplateFromQuickAccess({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      onOpenChange(false);
      showFeedback({
        variant: "success",
        title: t("preview.removeFromQuickAccess"),
        description: t("preview.removeQuickAccessSuccess"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: t("preview.removeFromQuickAccess"),
        description:
          error instanceof Error && error.message ? error.message : tActions("errors.generic"),
      });
    } finally {
      setIsUnpinning(false);
    }
  }

  async function handleEdit() {
    if (!template) return;
    setIsEditing(true);
    try {
      const editableTemplateId =
        template.source === "system"
          ? await createEditableTemplateCopy({
              templateId: template._id as Id<"questionnaireTemplates">,
            })
          : template._id;

      onOpenChange(false);
      router.push(`/practitioner/questionnaires/new?templateId=${editableTemplateId}`);
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: t("preview.edit"),
        description:
          error instanceof Error && error.message ? error.message : tActions("errors.generic"),
      });
    } finally {
      setIsEditing(false);
    }
  }

  async function handleDelete() {
    if (!template) return;
    setIsDeleting(true);
    try {
      await deleteTemplate({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      setIsDeleteConfirmOpen(false);
      onOpenChange(false);
      showFeedback({
        variant: "success",
        title: tActions("success.deleted"),
        description: t("preview.deleteSuccess"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: t("preview.deleteTemplate"),
        description:
          error instanceof Error && error.message ? error.message : t("preview.deleteError"),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleArchive() {
    if (!template) return;
    setIsArchiving(true);
    try {
      await archiveTemplate({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      setIsDeleteConfirmOpen(false);
      onOpenChange(false);
      showFeedback({
        variant: "success",
        title: tActions("success.archived"),
        description: t("preview.archiveSuccess"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: tActions("archive"),
        description:
          error instanceof Error && error.message ? error.message : t("preview.archiveError"),
      });
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleRestore() {
    if (!template) return;
    setIsRestoring(true);
    try {
      await unarchiveTemplate({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      onOpenChange(false);
      showFeedback({
        variant: "success",
        title: tActions("success.restored"),
        description: t("preview.restoreSuccess"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      showFeedback({
        variant: "error",
        title: tActions("restore"),
        description:
          error instanceof Error && error.message ? error.message : t("preview.restoreError"),
      });
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(92dvh,56rem)] w-[min(52rem,calc(100vw-1rem))] max-w-[min(52rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[2rem] border-none bg-white p-0 shadow-2xl sm:h-[min(90dvh,56rem)] sm:w-[min(52rem,calc(100vw-2rem))] sm:max-w-[min(52rem,calc(100vw-2rem))]">
          {template ? (
            <>
              <div className="shrink-0 border-b border-zinc-100 px-6 py-5 sm:px-8">
                <DialogHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700">
                      {context === "archived" ? t("archived.title") : t("explorer.title")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-zinc-200 px-3 py-1 text-zinc-600"
                    >
                      {template.source === "system" ? t("preview.system") : t("preview.custom")}
                    </Badge>
                    {template.isQuickAccess ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700"
                      >
                        <Pin className="me-1 size-3.5" />
                        {t("preview.quickAccess")}
                      </Badge>
                    ) : null}
                    {template.archivedAt ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-700"
                      >
                        {t("preview.archived")}
                      </Badge>
                    ) : null}
                  </div>
                  <DialogTitle className="text-2xl font-bold text-zinc-950 sm:text-3xl">
                    {template.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-zinc-500 sm:text-base">
                    {template.description || t("preview.noDescription")}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50/50 px-6 py-6 sm:px-8 sm:py-8">
                <QuestionnairePreview questions={template.questions} />
              </div>

              <DialogFooter className="shrink-0 flex-col gap-3 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex flex-wrap items-center gap-2">
                  {canPinQuickAccess ? (
                    <Button
                      variant="outline"
                      onClick={handlePinQuickAccess}
                      disabled={isPinning}
                      className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      {isPinning ? <Loader2 className="size-4 animate-spin" /> : <Pin className="size-4" />}
                      {t("preview.saveToQuickAccess")}
                    </Button>
                  ) : null}

                  {canUnpinQuickAccess ? (
                    <Button
                      variant="outline"
                      onClick={handleUnpinQuickAccess}
                      disabled={isUnpinning}
                      className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    >
                      {isUnpinning ? <Loader2 className="size-4 animate-spin" /> : <PinOff className="size-4" />}
                      {t("preview.removeFromQuickAccess")}
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    disabled={isEditing}
                    size="icon-lg"
                    aria-label={template.source === "system" ? t("preview.makeEditable") : t("preview.edit")}
                    title={template.source === "system" ? t("preview.makeEditable") : t("preview.edit")}
                    className="rounded-full border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                  >
                    {isEditing ? <Loader2 className="size-4 animate-spin" /> : <PencilLine className="size-4" />}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canArchiveTemplate ? (
                    <Button
                      variant="outline"
                      onClick={handleArchive}
                      disabled={isArchiving}
                      className="rounded-xl border-amber-200/80 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    >
                      {isArchiving ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                      {tActions("archive")}
                    </Button>
                  ) : null}

                  {canRestoreTemplate ? (
                    <Button
                      variant="outline"
                      onClick={handleRestore}
                      disabled={isRestoring}
                      className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    >
                      {isRestoring ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                      {tActions("restore")}
                    </Button>
                  ) : null}

                  {canDeleteTemplate ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      disabled={isDeleting}
                      aria-label={tActions("delete")}
                      title={tActions("delete")}
                      className="rounded-xl border-red-200/80 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      {tActions("delete")}
                    </Button>
                  ) : null}
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <DestructiveActionDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={t("preview.deleteConfirmTitle")}
        description={t("preview.deleteConfirmDescription")}
        cancelLabel={tActions("cancel")}
        confirmLabel={t("preview.confirmDelete")}
        onConfirm={handleDelete}
        isPending={isDeleting}
        alternativeLabel={canArchiveTemplate ? t("preview.archiveInstead") : undefined}
        onAlternative={canArchiveTemplate ? handleArchive : undefined}
        alternativePending={isArchiving}
      />
    </>
  );
}
