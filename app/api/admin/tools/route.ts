import { NextResponse } from "next/server";
import { upsertToolAdmin, deleteToolAdmin, reorderToolsAdmin, seedToolsAdmin } from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";

// POST handles upserting a tool
export async function POST(request: Request) {
  await requireAdminSession();

  try {
    const body = await request.json();
    const result = await upsertToolAdmin(body);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Upsert failed";
    return NextResponse.json({ detail }, { status: 400 });
  }
}

// DELETE handles deleting a tool
export async function DELETE(request: Request) {
  await requireAdminSession();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ detail: "Missing id parameter" }, { status: 400 });
    }

    await deleteToolAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ detail }, { status: 400 });
  }
}

// PATCH handles reordering tools
export async function PATCH(request: Request) {
  await requireAdminSession();

  try {
    const { orderedIds } = await request.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ detail: "orderedIds array is required" }, { status: 400 });
    }

    await reorderToolsAdmin(orderedIds);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Reordering failed";
    return NextResponse.json({ detail }, { status: 400 });
  }
}

// PUT handles seeding/initializing tools
export async function PUT() {
  await requireAdminSession();

  try {
    await seedToolsAdmin();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Seeding failed";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
