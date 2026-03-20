import { NextResponse } from "next/server";

import { createSystemTemplatesAdmin } from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";
import { parseTemplateUploadJson } from "@/lib/admin/templateValidation";

function getErrorCode(message: string) {
  if (message.includes("already exists")) return "duplicate_title";
  if (message.includes("Invalid JSON")) return "invalid_json";
  return "invalid_upload";
}

export async function POST(request: Request) {
  await requireAdminSession();

  const formData = await request.formData();
  const file = formData.get("file");
  const rawSelectedTags = formData.get("selectedTags");

  if (!(file instanceof File)) {
    return NextResponse.json({ code: "missing_file" }, { status: 400 });
  }

  const selectedTags =
    typeof rawSelectedTags === "string" ? ((JSON.parse(rawSelectedTags) as string[]) ?? []) : [];

  try {
    const rawJson = await file.text();
    const templates = parseTemplateUploadJson(rawJson, selectedTags);
    const insertedIds = await createSystemTemplatesAdmin(templates);

    return NextResponse.json({ ok: true, count: insertedIds.length });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { code: getErrorCode(detail), detail },
      { status: 400 }
    );
  }
}
