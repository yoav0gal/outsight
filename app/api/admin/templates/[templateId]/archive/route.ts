import { NextResponse } from "next/server";

import {
  archiveSystemTemplateAdmin,
  unarchiveSystemTemplateAdmin,
} from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";

export async function POST(
  request: Request,
  context: { params: Promise<{ templateId: string }> }
) {
  await requireAdminSession();

  const { templateId } = await context.params;
  const { archived } = (await request.json()) as { archived?: boolean };

  try {
    if (archived) {
      await archiveSystemTemplateAdmin(templateId);
    } else {
      await unarchiveSystemTemplateAdmin(templateId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Archive update failed";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
