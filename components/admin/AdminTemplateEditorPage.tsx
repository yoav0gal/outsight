"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { TemplateEditorForm } from "@/components/templates/TemplateEditorForm";
import type { TemplateEditorValues } from "@/lib/templateEditor";

interface AdminTemplateEditorPageProps {
  template: TemplateEditorValues & {
    _id: string;
  };
  availableTags: string[];
}

export function AdminTemplateEditorPage({
  template,
  availableTags,
}: AdminTemplateEditorPageProps) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  async function handleSubmit(values: TemplateEditorValues) {
    setIsSubmitting(true);
    setTitleError("");

    try {
      const response = await fetch(`/api/admin/templates/${template._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const body = (await response.json()) as { detail?: string; code?: string };
      if (!response.ok) {
        if (body.code === "duplicate_title") {
          setTitleError(t("errors.duplicateTitle"));
          return;
        }

        alert(body.detail || t("shared.genericError"));
        return;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch {
      alert(t("shared.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TemplateEditorForm
      mode="edit"
      initialValues={template}
      availableTags={availableTags}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={() => router.push("/admin/templates")}
      backLabel={t("editor.back")}
      onBack={() => router.push("/admin/templates")}
      pageTitle={t("editor.title")}
      pageDescription={t("editor.description")}
      submitLabel={t("editor.save")}
      titleError={titleError}
      clearTitleError={() => setTitleError("")}
      canEditTags
    />
  );
}
