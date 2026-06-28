"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  PencilLine,
  Search,
  Sparkles,
  X,
  Power,
  RotateCcw
} from "lucide-react";

import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AdminTherapeuticTool } from "@/lib/admin/convex";

interface AdminToolsDashboardProps {
  initialTools: AdminTherapeuticTool[];
}

export function AdminToolsDashboard({ initialTools }: AdminToolsDashboardProps) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const [tools, setTools] = useState<AdminTherapeuticTool[]>(initialTools);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formNameHe, setFormNameHe] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tools;

    return tools.filter(
      (tool) =>
        tool.key.toLowerCase().includes(query) ||
        tool.nameEn.toLowerCase().includes(query) ||
        tool.nameHe.toLowerCase().includes(query)
    );
  }, [tools, search]);

  const handleEditClick = (tool: AdminTherapeuticTool) => {
    setError("");
    setSuccess("");
    setEditingId(tool._id);
    setFormKey(tool.key);
    setFormNameEn(tool.nameEn);
    setFormNameHe(tool.nameHe);
    setFormIsActive(tool.isActive);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormKey("");
    setFormNameEn("");
    setFormNameHe("");
    setFormIsActive(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const key = formKey.trim();
    const nameEn = formNameEn.trim();
    const nameHe = formNameHe.trim();

    if (!key || !nameEn || !nameHe) {
      setError(t("shared.genericError"));
      return;
    }

    // Key validation: start with lowercase, only alphanumeric
    const keyRegex = /^[a-z][a-zA-Z0-9]*$/;
    if (!keyRegex.test(key)) {
      setError(t("tools.keyInvalidError"));
      return;
    }

    // Check duplicate key
    const duplicate = tools.find((t) => t.key === key && t._id !== editingId);
    if (duplicate) {
      setError(t("tools.keyExistsError"));
      return;
    }

    setIsSaving(true);

    try {
      // Find the order for new tools: max + 1
      const order = editingId
        ? tools.find((t) => t._id === editingId)?.order ?? tools.length + 1
        : tools.reduce((max, t) => Math.max(max, t.order), 0) + 1;

      const response = await fetch("/api/admin/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          key,
          nameEn,
          nameHe,
          isActive: formIsActive,
          order,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.detail || t("shared.genericError"));
        return;
      }

      setSuccess(
        editingId
          ? locale === "he"
            ? "הכלי הטיפולי עודכן בהצלחה."
            : "Therapeutic tool updated successfully."
          : locale === "he"
            ? "הכלי הטיפולי נוסף בהצלחה."
            : "Therapeutic tool added successfully."
      );

      handleCancelEdit();
      
      // Refresh the page data from server
      startTransition(() => {
        router.refresh();
      });
      
      // Briefly local-sync until refresh propagates
      if (editingId) {
        setTools((prev) =>
          prev.map((t) =>
            t._id === editingId ? { ...t, key, nameEn, nameHe, isActive: formIsActive } : t
          )
        );
      } else {
        // Wait, body.result has the new _id from Convex
        const newTool: AdminTherapeuticTool = {
          _id: body.result,
          _creationTime: Date.now(),
          key,
          nameEn,
          nameHe,
          isActive: formIsActive,
          order,
        };
        setTools((prev) => [...prev, newTool]);
      }
    } catch {
      setError(t("shared.genericError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("tools.deleteConfirm"))) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/tools?id=${id}`, {
        method: "DELETE",
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.detail || t("shared.genericError"));
        return;
      }

      setSuccess(
        locale === "he"
          ? "הכלי הטיפולי נמחק בהצלחה."
          : "Therapeutic tool deleted successfully."
      );

      setTools((prev) => prev.filter((t) => t._id !== id));
      
      if (editingId === id) {
        handleCancelEdit();
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(t("shared.genericError"));
    }
  };

  const handleToggleActive = async (tool: AdminTherapeuticTool) => {
    setError("");
    setSuccess("");

    try {
      const newStatus = !tool.isActive;
      const response = await fetch("/api/admin/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tool._id,
          key: tool.key,
          nameEn: tool.nameEn,
          nameHe: tool.nameHe,
          isActive: newStatus,
          order: tool.order,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.detail || t("shared.genericError"));
        return;
      }

      setTools((prev) =>
        prev.map((t) => (t._id === tool._id ? { ...t, isActive: newStatus } : t))
      );

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(t("shared.genericError"));
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tools.length) return;

    const list = [...tools];
    // Swap items
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Recalculate order values
    const updatedList = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    setTools(updatedList);

    try {
      const orderedIds = updatedList.map((t) => t._id);
      const response = await fetch("/api/admin/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.detail || t("shared.genericError"));
        // Revert order if error
        setTools(tools);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(t("shared.genericError"));
      setTools(tools);
    }
  };

  const handleSeedDefaults = async () => {
    setError("");
    setSuccess("");
    setIsSeeding(true);

    try {
      const response = await fetch("/api/admin/tools", {
        method: "PUT",
      });

      if (!response.ok) {
        const body = await response.json();
        setError(body.detail || t("shared.genericError"));
        return;
      }

      setSuccess(
        locale === "he"
          ? "כללי ברירת המחדל יובאו בהצלחה."
          : "Default tools successfully seeded."
      );

      // Force a full reload of page data
      window.location.reload();
    } catch {
      setError(t("shared.genericError"));
    } finally {
      setIsSeeding(false);
    }
  };

  // Sync state if initialTools changes
  useMemo(() => {
    setTools(initialTools);
  }, [initialTools]);

  return (
    <main className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(135deg,rgba(238,242,255,0.96),rgba(255,255,255,0.98))] shadow-sm">
          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700 font-semibold">
                {t("dashboard.eyebrow")}
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                {t("tools.title")}
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-600">
                {t("tools.description")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/templates">
                <Button variant="outline" className="rounded-xl border-zinc-200 bg-white">
                  <ArrowLeft className="size-4 rtl:rotate-180" />
                  {t("tools.back")}
                </Button>
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </section>

        {/* Action Alerts */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {success}
          </div>
        )}

        {/* Full-width Stacked Layout */}
        <section className="flex flex-col gap-6 w-full">
          
          {/* Card 1: Add/Edit Tool Form */}
          <Card className="rounded-[2rem] border-zinc-200/70 bg-white shadow-sm w-full">
            <CardContent className="space-y-6 px-6 py-6 sm:px-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-950">
                      {editingId ? t("tools.editToolTitle") : t("tools.addToolTitle")}
                    </h2>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="toolKey" className="text-sm font-semibold text-zinc-800">
                      {t("tools.keyLabel")}
                    </Label>
                    <Input
                      id="toolKey"
                      value={formKey}
                      onChange={(e) => setFormKey(e.target.value)}
                      placeholder={t("tools.keyPlaceholder")}
                      disabled={!!editingId}
                      required
                      className="h-12 rounded-xl border-zinc-200 text-sm focus-visible:ring-indigo-500"
                    />
                    {!editingId && (
                      <p className="text-[11px] text-zinc-500 font-medium">
                        * {t("tools.keyInvalidError")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toolNameHe" className="text-sm font-semibold text-zinc-800">
                      {t("tools.nameHeLabel")}
                    </Label>
                    <Input
                      id="toolNameHe"
                      value={formNameHe}
                      onChange={(e) => setFormNameHe(e.target.value)}
                      placeholder={t("tools.nameHePlaceholder")}
                      required
                      className="h-12 rounded-xl border-zinc-200 text-sm focus-visible:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toolNameEn" className="text-sm font-semibold text-zinc-800">
                      {t("tools.nameEnLabel")}
                    </Label>
                    <Input
                      id="toolNameEn"
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      placeholder={t("tools.nameEnPlaceholder")}
                      required
                      className="h-12 rounded-xl border-zinc-200 text-sm focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
                  <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 max-w-xl w-full">
                    <input
                      id="toolActive"
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="mt-1 h-4.5 w-4.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="toolActive" className="text-sm font-bold text-zinc-800 cursor-pointer">
                        {t("tools.activeLabel")}
                      </Label>
                      <p className="text-xs text-zinc-500 leading-snug">
                        {t("tools.activeDescription")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[15rem]">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {isSaving ? t("tools.savingButton") : t("tools.saveButton")}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-12 rounded-xl border-zinc-200"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Tools List & Management */}
          <Card className="rounded-[2rem] border-zinc-200/70 bg-white shadow-sm w-full">
            <CardContent className="space-y-6 px-6 py-6 sm:px-8">
              
              {/* Toolbar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={locale === "he" ? "חפש כלי טיפולי..." : "Search therapeutic tools..."}
                    className="ps-9 h-11 rounded-xl border-zinc-200 text-sm focus-visible:ring-indigo-500"
                  />
                </div>
                {tools.length === 0 && (
                  <Button
                    onClick={handleSeedDefaults}
                    disabled={isSeeding}
                    variant="outline"
                    className="h-11 rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 hover:text-indigo-800 disabled:opacity-50"
                  >
                    <RotateCcw className={`size-4 ${isSeeding ? "animate-spin" : ""}`} />
                    {isSeeding ? t("tools.seedingButton") : t("tools.seedButton")}
                  </Button>
                )}
              </div>

              {/* Tools List */}
              <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-zinc-50/20">
                <table className="w-full text-start border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="px-4 py-3.5 text-center font-bold w-16">{t("tools.orderLabel")}</th>
                      <th className="px-4 py-3.5 text-start font-bold w-20">{t("tools.activeLabel")}</th>
                      <th className="px-4 py-3.5 text-start font-bold">{t("tools.keyLabel")}</th>
                      <th className="px-4 py-3.5 text-start font-bold">{t("tools.nameHeLabel")}</th>
                      <th className="px-4 py-3.5 text-start font-bold">{t("tools.nameEnLabel")}</th>
                      <th className="px-4 py-3.5 text-end font-bold pe-6 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {filteredTools.map((tool) => {
                      const absoluteIndex = tools.findIndex((t) => t._id === tool._id);
                      return (
                        <tr
                          key={tool._id}
                          className={`hover:bg-zinc-50/50 transition-colors ${
                            editingId === tool._id ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          {/* Order actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={absoluteIndex === 0}
                                onClick={() => handleMove(absoluteIndex, "up")}
                                className="p-1 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-20 transition-colors"
                              >
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={absoluteIndex === tools.length - 1}
                                onClick={() => handleMove(absoluteIndex, "down")}
                                className="p-1 rounded hover:bg-zinc-100 text-zinc-500 disabled:opacity-20 transition-colors"
                              >
                                <ArrowDown className="size-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Active Toggle */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(tool)}
                              className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                                tool.isActive
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100"
                              }`}
                            >
                              <Power className="size-4" />
                            </button>
                          </td>

                          {/* Key */}
                          <td className="px-4 py-3 font-semibold text-zinc-950 font-mono text-xs">{tool.key}</td>

                          {/* Hebrew Name */}
                          <td className="px-4 py-3 font-medium text-zinc-700 whitespace-nowrap">{tool.nameHe}</td>

                          {/* English Name */}
                          <td className="px-4 py-3 font-medium text-zinc-700 whitespace-nowrap">{tool.nameEn}</td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3 text-end pe-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditClick(tool)}
                                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-indigo-600 transition-colors"
                              >
                                <PencilLine className="size-4.5" />
                              </button>
                              {/* Show delete only if not a temporary ID (or let it delete) */}
                              <button
                                type="button"
                                onClick={() => handleDelete(tool._id)}
                                className="p-2 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="size-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTools.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium leading-relaxed">
                          {t("tools.emptyList")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </main>
  );
}
