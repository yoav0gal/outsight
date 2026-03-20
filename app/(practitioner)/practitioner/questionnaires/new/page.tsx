"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TemplateEditorForm } from "@/components/templates/TemplateEditorForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  createEmptyTemplateValues,
  normalizeQuestions,
  normalizeTemplateDescription,
  normalizeTemplateTags,
  normalizeTemplateTitle,
  type TemplateEditorValues,
} from "@/lib/templateEditor";

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("CreateTemplate");
  const createTemplate = useMutation(api.questionnaires.createTemplate);
  const updateTemplate = useMutation(api.questionnaires.updateTemplate);
  const availableTags = useQuery(api.questionnaires.listTemplateTags);
  const visibleTemplates = useQuery(api.questionnaires.listTemplates);
  const rawTemplateId = searchParams.get("templateId");
  const templateId =
    rawTemplateId && visibleTemplates?.some((template) => template._id === rawTemplateId)
      ? (rawTemplateId as Id<"questionnaireTemplates">)
      : null;
  const existingTemplate = useQuery(
    api.questionnaires.getTemplate,
    templateId ? { templateId } : "skip"
  );
  const isEditing = !!rawTemplateId;
  const isResolvingTemplate = !!rawTemplateId && visibleTemplates === undefined;
  const hasInvalidTemplateId = !!rawTemplateId && visibleTemplates !== undefined && !templateId;
  const isLoadingTemplate = !!templateId && existingTemplate === undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  const isSystemTemplate = existingTemplate?.source === "system";

  const initialValues = useMemo(() => {
    if (!existingTemplate) {
      return createEmptyTemplateValues();
    }

    return {
      title: existingTemplate.title,
      description: existingTemplate.description || "",
      tags: existingTemplate.tags || [],
      questions: existingTemplate.questions,
    };
  }, [existingTemplate]);

  const handleSubmit = async (values: TemplateEditorValues) => {
    if (!values.title.trim() || values.questions.length === 0) return;
    if (isEditing && !templateId) {
      alert(t("invalidTemplate"));
      router.push("/practitioner/questionnaires");
      return;
    }

    const normalizedValues = {
      title: normalizeTemplateTitle(values.title),
      description: normalizeTemplateDescription(values.description),
      tags: normalizeTemplateTags(values.tags),
      questions: normalizeQuestions(values.questions),
    };

    if (
      isEditing &&
      existingTemplate &&
      JSON.stringify(normalizedValues) ===
        JSON.stringify({
          title: normalizeTemplateTitle(existingTemplate.title),
          description: normalizeTemplateDescription(existingTemplate.description || ""),
          tags: normalizeTemplateTags(existingTemplate.tags || []),
          questions: normalizeQuestions(existingTemplate.questions),
        })
    ) {
      router.push("/practitioner/questionnaires");
      return;
    }

    setIsSubmitting(true);
    setTitleError("");
    try {
      if (templateId && !isSystemTemplate) {
        await updateTemplate({
          templateId,
          title: normalizedValues.title,
          description: normalizedValues.description,
          tags: normalizedValues.tags,
          questions: normalizedValues.questions,
        });
      } else {
        await createTemplate({
          title: normalizedValues.title,
          description: normalizedValues.description,
          tags: normalizedValues.tags,
          questions: normalizedValues.questions,
        });
      }

      alert(isEditing ? t("updatedSuccess") : t("success"));
      router.push("/practitioner/questionnaires");
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes("already exists")) {
        setTitleError(t("duplicateName"));
      }
      alert(isEditing ? t("updatedError") : t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResolvingTemplate || isLoadingTemplate) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full p-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-6 text-sm text-zinc-500">{t("loadingTemplate")}</CardContent>
        </Card>
      </main>
    );
  }

  if (hasInvalidTemplateId || (isEditing && !existingTemplate)) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full p-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div>
              <h1 className="text-xl font-semibold text-zinc-950">{t("invalidTemplate")}</h1>
              <p className="mt-2 text-sm text-zinc-500">{t("invalidTemplateDescription")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/practitioner/questionnaires")}
            >
              {t("backToQuestionnaires")}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <TemplateEditorForm
      key={templateId ?? "new-template"}
      mode={isEditing ? "edit" : "create"}
      initialValues={initialValues}
      availableTags={availableTags ?? []}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/practitioner/questionnaires")}
      backLabel={t("backToQuestionnaires")}
      onBack={() => router.back()}
      titleError={titleError}
      clearTitleError={() => setTitleError("")}
      canEditTags={!isSystemTemplate}
    />
  );
}
