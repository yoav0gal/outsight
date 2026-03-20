"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, FileUp, PencilLine, Plus, Search, Tags, Trash2 } from "lucide-react";

import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminTemplateSummary {
  _id: string;
  title: string;
  description?: string;
  tags: string[];
  questions: Array<{ id: string }>;
  archivedAt?: number;
}

interface AdminTemplatesDashboardProps {
  templates: AdminTemplateSummary[];
  availableTags: string[];
}

export function AdminTemplatesDashboard({
  templates,
  availableTags,
}: AdminTemplatesDashboardProps) {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const tagFilter = new Set(selectedTags.map((tag) => tag.toLocaleLowerCase()));

    return templates.filter((template) => {
      if (normalizedSearch && !template.title.toLocaleLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (
        tagFilter.size > 0 &&
        !template.tags.some((tag) => tagFilter.has(tag.toLocaleLowerCase()))
      ) {
        return false;
      }

      return true;
    });
  }, [search, selectedTags, templates]);

  function toggleFilterTag(tag: string) {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  }

  function toggleUploadTag(tag: string) {
    setUploadTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  }

  function addCustomTag() {
    const normalizedTag = customTag.trim();
    if (!normalizedTag) return;

    setUploadTags((currentTags) => {
      if (currentTags.some((tag) => tag.toLocaleLowerCase() === normalizedTag.toLocaleLowerCase())) {
        return currentTags;
      }

      return [...currentTags, normalizedTag];
    });
    setCustomTag("");
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("selectedTags", JSON.stringify(uploadTags));

      const response = await fetch("/api/admin/templates/import", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json()) as { count?: number; detail?: string; code?: string };
      if (!response.ok) {
        setError(body.detail || t("shared.genericError"));
        return;
      }

      setSuccess(t("dashboard.uploadSuccess", { count: body.count ?? 0 }));
      setSelectedFile(null);
      setUploadTags([]);
      router.refresh();
    } catch {
      setError(t("shared.genericError"));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleArchive(templateId: string, archived: boolean) {
    setPendingTemplateId(templateId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/templates/${templateId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived }),
      });

      const body = (await response.json()) as { detail?: string };
      if (!response.ok) {
        setError(body.detail || t("shared.genericError"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("shared.genericError"));
    } finally {
      setPendingTemplateId(null);
    }
  }

  async function handleDelete(templateId: string) {
    if (!window.confirm(t("dashboard.deleteConfirm"))) {
      return;
    }

    setPendingTemplateId(templateId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { detail?: string };

      if (!response.ok) {
        setError(body.detail || t("shared.genericError"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("shared.genericError"));
    } finally {
      setPendingTemplateId(null);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(135deg,rgba(238,242,255,0.96),rgba(255,255,255,0.98))] shadow-sm">
          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700">
                {t("dashboard.eyebrow")}
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                {t("dashboard.title")}
              </h1>
              <p className="mt-3 text-base leading-7 text-zinc-600">{t("dashboard.description")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/questionnaire-visual-lab">
                <Button variant="outline" className="rounded-xl border-zinc-200 bg-white">
                  {t("dashboard.playground")}
                </Button>
              </Link>
              <Link href="/admin/templates/new">
                <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                  <Plus className="size-4" />
                  {t("dashboard.createButton")}
                </Button>
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <Card className="rounded-[2rem] border-zinc-200/70 bg-white shadow-sm">
            <CardContent className="space-y-6 px-6 py-6 sm:px-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <FileUp className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-950">{t("dashboard.uploadTitle")}</h2>
                    <p className="text-sm text-zinc-500">{t("dashboard.uploadDescription")}</p>
                  </div>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleUpload}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900" htmlFor="templateFile">
                    {t("dashboard.fileLabel")}
                  </label>
                  <Input
                    id="templateFile"
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="h-12 rounded-xl border-zinc-200"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tags className="size-4 text-zinc-500" />
                    <p className="text-sm font-medium text-zinc-900">{t("dashboard.uploadTags")}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={uploadTags.includes(tag) ? "secondary" : "outline"}
                        onClick={() => toggleUploadTag(tag)}
                        className="rounded-full px-4"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>

                  {uploadTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {uploadTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={customTag}
                      onChange={(event) => setCustomTag(event.target.value)}
                      placeholder={t("dashboard.customTagPlaceholder")}
                      className="h-11 rounded-xl border-zinc-200"
                    />
                    <Button type="button" variant="outline" onClick={addCustomTag} className="h-11 rounded-xl">
                      {t("dashboard.addTag")}
                    </Button>
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? t("dashboard.uploading") : t("dashboard.uploadButton")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <section className="space-y-6">
            <Card className="rounded-[2rem] border-zinc-200/70 bg-white shadow-sm">
              <CardContent className="space-y-5 px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-950">{t("dashboard.libraryTitle")}</h2>
                    <p className="text-sm text-zinc-500">{t("dashboard.libraryDescription")}</p>
                  </div>
                  <Badge variant="secondary" className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                    {t("dashboard.count", { count: templates.length })}
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("dashboard.searchPlaceholder")}
                    className="h-12 rounded-xl border-zinc-200 ps-9"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                      onClick={() => toggleFilterTag(tag)}
                      className="rounded-full px-4"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {filteredTemplates.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-6 py-14 text-center text-zinc-500">
                <p className="text-lg font-semibold text-zinc-900">{t("dashboard.emptyTitle")}</p>
                <p className="mt-2 text-sm leading-6">{t("dashboard.emptyDescription")}</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredTemplates.map((template) => (
                  <Card key={template._id} className="rounded-[1.75rem] border-zinc-200/70 bg-white shadow-sm">
                    <CardContent className="flex h-full flex-col gap-4 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-zinc-950">{template.title}</h3>
                            {template.archivedAt ? (
                              <Badge className="rounded-full border-none bg-amber-100 px-2.5 py-1 text-amber-700">
                                {t("dashboard.archived")}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                            {template.description || t("dashboard.noDescription")}
                          </p>
                        </div>
                      </div>

                      {template.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                        <span className="text-sm font-medium text-zinc-600">
                          {t("dashboard.questionsCount", { count: template.questions.length })}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/templates/${template._id}`}>
                            <Button variant="outline" size="icon-lg" className="rounded-full border-zinc-200">
                              <PencilLine className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon-lg"
                            className="rounded-full border-zinc-200"
                            onClick={() => handleArchive(template._id, !template.archivedAt)}
                            disabled={pendingTemplateId === template._id}
                          >
                            <Archive className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-lg"
                            className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(template._id)}
                            disabled={pendingTemplateId === template._id}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
