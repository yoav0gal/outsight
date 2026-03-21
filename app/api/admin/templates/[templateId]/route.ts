import { NextResponse } from "next/server";

import { deleteSystemTemplateAdmin, updateSystemTemplateAdmin } from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";
import type { TemplateEditorValues } from "@/lib/templateEditor";

function getErrorCode(message: string) {
  if (message.includes("already exists")) return "duplicate_title";
  if (message.includes("cannot be deleted")) return "delete_blocked";
  if (message.includes("Template not found")) return "not_found";
  return "unknown_error";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ templateId: string }> }
) {
  await requireAdminSession();

  const { templateId } = await context.params;
  const body = (await request.json()) as TemplateEditorValues;

  try {
    await updateSystemTemplateAdmin(templateId, {
      title: body.title,
      description: body.description || undefined,
      titleTranslations: body.titleTranslations,
      descriptionTranslations: body.descriptionTranslations,
      tags: body.tags,
      tagTranslations: body.tagTranslations,
      scoring: body.scoring,
      questions: body.questions,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ code: getErrorCode(detail), detail }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ templateId: string }> }
) {
  await requireAdminSession();

  const { templateId } = await context.params;

  try {
    await deleteSystemTemplateAdmin(templateId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ code: getErrorCode(detail), detail }, { status: 400 });
  }
}
