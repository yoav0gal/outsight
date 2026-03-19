"use client";

import { useState } from "react";
import { Archive, Library, Loader2, PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuestionnairePreview } from "@/components/QuestionnairePreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateDialogTemplate {
  _id: Id<"questionnaireTemplates">;
  title: string;
  description?: string;
  tags: string[];
  source: "system" | "practitioner";
  isInClinic?: boolean;
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
  context: "clinic" | "explorer" | "archived";
}

export function QuestionnaireTemplateDialog({
  open,
  onOpenChange,
  template,
  context,
}: QuestionnaireTemplateDialogProps) {
  const router = useRouter();
  const t = useTranslations("PractitionerQuestionnaires");
  const saveToClinic = useMutation(api.questionnaires.saveTemplateToClinic);
  const removeFromClinic = useMutation(api.questionnaires.removeTemplateFromClinic);
  const deleteTemplate = useMutation(api.questionnaires.deleteTemplate);
  const createEditableTemplateCopy = useMutation(
    api.questionnaires.createEditableTemplateCopy
  );
  const archiveTemplate = useMutation(api.questionnaires.archiveTemplate);
  const unarchiveTemplate = useMutation(api.questionnaires.unarchiveTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const canDeleteTemplate = context !== "clinic" && template?.source === "practitioner";
  const canRemoveFromClinic = context === "clinic" && !!template?.isInClinic;
  const canArchiveTemplate = template?.source === "practitioner" && !template?.archivedAt;
  const canRestoreTemplate = template?.source === "practitioner" && !!template?.archivedAt;

  async function handleSave() {
    if (!template) return;
    setIsSaving(true);
    try {
      await saveToClinic({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      onOpenChange(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (!template) return;
    setIsRemoving(true);
    try {
      await removeFromClinic({
        templateId: template._id as Id<"questionnaireTemplates">,
      });
      onOpenChange(false);
      router.refresh();
    } finally {
      setIsRemoving(false);
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
      alert(
        error instanceof Error && error.message ? error.message : t("preview.deleteError")
      );
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
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error && error.message
          ? error.message
          : t("preview.deleteError")
      );
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
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error && error.message ? error.message : t("preview.archiveError")
      );
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
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error && error.message ? error.message : t("preview.restoreError")
      );
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
                      {context === "clinic"
                        ? t("clinic.badge")
                        : context === "archived"
                          ? t("archived.badge")
                          : t("explorer.badge")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full border-zinc-200 px-3 py-1 text-zinc-600"
                    >
                      {template.source === "system" ? t("preview.system") : t("preview.custom")}
                    </Badge>
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
                  {template.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {template.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50/50 px-6 py-6 sm:px-8 sm:py-8">
                <QuestionnairePreview questions={template.questions} />
              </div>

              <DialogFooter className="shrink-0 flex-col gap-3 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex items-center gap-2">
                  {template.archivedAt ? null : template.isInClinic ? (
                    <Badge className="rounded-full border-none bg-emerald-100 px-3 py-1 text-emerald-700">
                      <Library className="size-4" />
                      {t("preview.inClinic")}
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Library className="size-4" />}
                      {t("preview.saveToClinic")}
                    </Button>
                  )}

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

                <div className="flex items-center gap-2">
                  {canArchiveTemplate ? (
                    <Button
                      variant="outline"
                      onClick={handleArchive}
                      disabled={isArchiving}
                      className="rounded-xl border-amber-200/80 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    >
                      {isArchiving ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                      {t("preview.archive")}
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
                      {t("preview.restore")}
                    </Button>
                  ) : null}

                  {canDeleteTemplate ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      disabled={isDeleting}
                      size="icon-lg"
                      aria-label={t("preview.deleteTemplate")}
                      title={t("preview.deleteTemplate")}
                      className="rounded-full border-red-200/80 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  ) : canRemoveFromClinic ? (
                    <Button
                      variant="outline"
                      onClick={handleRemove}
                      disabled={isRemoving}
                      size="icon-lg"
                      aria-label={t("preview.removeFromClinic")}
                      title={t("preview.removeFromClinic")}
                      className="rounded-full border-red-200/80 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  ) : null}
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-[min(28rem,calc(100vw-2rem))] max-w-[min(28rem,calc(100vw-2rem))] rounded-[1.5rem] border-none p-0 shadow-2xl"
        >
          <div className="p-6 sm:p-7">
            <DialogHeader className="gap-3">
              <DialogTitle className="text-xl font-bold text-zinc-950">
                {t("preview.deleteConfirmTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-zinc-600">
                {template?.isInClinic
                  ? t("preview.deleteConfirmWithClinic")
                  : t("preview.deleteConfirmDescription")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="border-t border-zinc-100 px-6 py-4 sm:flex-row sm:justify-between sm:px-7">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                />
              }
            >
              {t("preview.cancelDelete")}
            </DialogClose>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {t("preview.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
