import { NextResponse } from "next/server";

import { createSystemTemplatesAdmin } from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";
import type { TemplateEditorValues } from "@/lib/templateEditor";

function getErrorCode(message: string) {
  if (message.includes("already exists")) return "duplicate_title";
  return "unknown_error";
}

export async function POST(request: Request) {
  await requireAdminSession();

  const body = (await request.json()) as TemplateEditorValues;

  try {
    const insertedIds = await createSystemTemplatesAdmin([
      {
        title: body.title,
        description: body.description || undefined,
        tags: body.tags,
        questions: body.questions,
      },
    ]);

    return NextResponse.json({ ok: true, templateId: insertedIds[0] });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ code: getErrorCode(detail), detail }, { status: 400 });
  }
}
