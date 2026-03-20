import { notFound } from "next/navigation";

import { AdminTemplateEditorPage } from "@/components/admin/AdminTemplateEditorPage";
import { getSystemTemplateAdmin, listAllTemplateTagsAdmin } from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";

export default async function AdminTemplateEditPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await requireAdminSession();

  const { templateId } = await params;
  let template;
  let availableTags;

  try {
    [template, availableTags] = await Promise.all([
      getSystemTemplateAdmin(templateId),
      listAllTemplateTagsAdmin(),
    ]);
  } catch {
    notFound();
  }

  return (
    <AdminTemplateEditorPage
      template={{
        _id: template._id,
        title: template.title,
        description: template.description || "",
        tags: template.tags || [],
        questions: template.questions,
      }}
      availableTags={availableTags}
    />
  );
}
