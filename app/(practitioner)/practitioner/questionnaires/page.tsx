"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { Archive, Compass, FileText, Library, Plus, Search } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuestionnaireTemplateDialog } from "@/components/practitioner/QuestionnaireTemplateDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TemplateItem = {
  _id: Id<"questionnaireTemplates">;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    prompt: string;
    type: string;
    required?: boolean;
    options?: string[];
    scaleConfig?: {
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
    };
  }>;
  tags: string[];
  source: "system" | "practitioner";
  isInClinic?: boolean;
  archivedAt?: number;
};

function TemplateCard({
  template,
  showClinicMarker = false,
  onClick,
}: {
  template: TemplateItem;
  showClinicMarker?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("PractitionerQuestionnaires");

  return (
    <Card
      className="group cursor-pointer rounded-[1.75rem] border-zinc-200/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-start">
            <h3 className="truncate text-lg font-semibold text-zinc-950">{template.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
              {template.description || t("preview.noDescription")}
            </p>
          </div>
          {showClinicMarker && template.isInClinic ? (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
              aria-label={t("preview.inClinic")}
              title={t("preview.inClinic")}
            >
              <Library className="size-4" />
            </span>
          ) : null}
        </div>

        {template.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <span className="text-sm font-medium text-zinc-600">
            {t("questionsCount", { count: template.questions.length })}
          </span>
          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            {template.archivedAt
              ? t("preview.archived")
              : template.source === "system"
                ? t("preview.system")
                : t("preview.custom")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
      <Icon className="mx-auto mb-4 size-10 text-zinc-300" />
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

export default function PractitionerQuestionnaires() {
  const t = useTranslations("PractitionerQuestionnaires");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [selectedContext, setSelectedContext] = useState<"clinic" | "explorer" | "archived">("clinic");

  const explorerTemplates = useQuery(api.questionnaires.listTemplatesExplorer, {
    search,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });
  const clinicTemplates = useQuery(api.questionnaires.listClinicTemplates);
  const archivedTemplates = useQuery(api.questionnaires.listArchivedTemplates);
  const tags = useQuery(api.questionnaires.listTemplateTags);

  const clinicTemplateById = useMemo(() => {
    return new Map<Id<"questionnaireTemplates">, TemplateItem>(
      (clinicTemplates ?? []).map((template) => [template._id, template])
    );
  }, [clinicTemplates]);

  const explorerCount = explorerTemplates?.length ?? 0;
  const clinicCount = clinicTemplates?.length ?? 0;
  const archivedCount = archivedTemplates?.length ?? 0;

  const openTemplate = (
    template: TemplateItem,
    context: "clinic" | "explorer" | "archived"
  ) => {
    setSelectedTemplate({
      ...template,
      isInClinic: clinicTemplateById.has(template._id) || template.isInClinic,
    });
    setSelectedContext(context);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white shadow-sm">
          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700">
                {t("eyebrow")}
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-3 text-base leading-7 text-zinc-600">{t("description")}</p>
            </div>
            <Link href="/practitioner/questionnaires/new">
              <Button size="lg" className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-500">
                <Plus className="size-4" />
                {t("createTemplate")}
              </Button>
            </Link>
          </div>
        </section>

        <div className="hidden md:flex md:flex-col md:gap-8">
          <section className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <Library className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-950">{t("clinic.title")}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{t("clinic.description")}</p>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                {t("clinic.count", { count: clinicCount })}
              </Badge>
            </div>

            {!clinicTemplates ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
                ))}
              </div>
            ) : clinicTemplates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t("clinic.emptyTitle")}
                description={t("clinic.emptyDescription")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {clinicTemplates.map((template) => (
                  <TemplateCard
                    key={template._id}
                    template={{ ...template, isInClinic: true }}
                    onClick={() => openTemplate({ ...template, isInClinic: true }, "clinic")}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                      <Compass className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-zinc-950">{t("explorer.title")}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{t("explorer.description")}</p>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                  {t("explorer.count", { count: explorerCount })}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("explorer.searchPlaceholder")}
                    className="h-11 rounded-xl border-zinc-200 bg-white ps-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={selectedTags.length > 0 ? "outline" : "secondary"}
                    onClick={() => setSelectedTags([])}
                    className="rounded-full px-4"
                  >
                    {t("explorer.allTags")}
                  </Button>
                  {(tags ?? []).map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                      onClick={() => toggleTag(tag)}
                      className="rounded-full px-4"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {!explorerTemplates ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
                ))}
              </div>
            ) : explorerTemplates.length === 0 ? (
              <EmptyState
                icon={Compass}
                title={t("explorer.emptyTitle")}
                description={t("explorer.emptyDescription")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {explorerTemplates.map((template) => (
                  <TemplateCard
                    key={template._id}
                    template={template}
                    showClinicMarker
                    onClick={() => openTemplate(template, "explorer")}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-zinc-200/70 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Archive className="size-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-950">{t("archived.title")}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{t("archived.description")}</p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                {t("archived.count", { count: archivedCount })}
              </Badge>
            </div>

            {!archivedTemplates ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
                ))}
              </div>
            ) : archivedTemplates.length === 0 ? (
              <EmptyState
                icon={Archive}
                title={t("archived.emptyTitle")}
                description={t("archived.emptyDescription")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {archivedTemplates.map((template) => (
                  <TemplateCard
                    key={template._id}
                    template={template}
                    onClick={() => openTemplate(template, "archived")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="md:hidden">
          <Tabs defaultValue="clinic" className="w-full">
            <TabsList className="mb-5 inline-flex w-full rounded-xl bg-zinc-100 p-1">
              <TabsTrigger value="clinic" className="rounded-lg">
                {t("clinic.title")}
              </TabsTrigger>
              <TabsTrigger value="explorer" className="rounded-lg">
                {t("explorer.title")}
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-lg">
                {t("archived.title")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clinic">
              <section className="rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-950">{t("clinic.title")}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{t("clinic.description")}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                    {t("clinic.count", { count: clinicCount })}
                  </Badge>
                </div>

                {!clinicTemplates ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
                    ))}
                  </div>
                ) : clinicTemplates.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={t("clinic.emptyTitle")}
                    description={t("clinic.emptyDescription")}
                  />
                ) : (
                  <div className="space-y-4">
                    {clinicTemplates.map((template) => (
                      <TemplateCard
                        key={template._id}
                        template={{ ...template, isInClinic: true }}
                        onClick={() => openTemplate({ ...template, isInClinic: true }, "clinic")}
                      />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="explorer">
              <section className="rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-sm">
                <div className="mb-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-950">{t("explorer.title")}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{t("explorer.description")}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                      {t("explorer.count", { count: explorerCount })}
                    </Badge>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("explorer.searchPlaceholder")}
                      className="h-11 rounded-xl border-zinc-200 bg-white ps-9"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selectedTags.length > 0 ? "outline" : "secondary"}
                      onClick={() => setSelectedTags([])}
                      className="rounded-full px-4"
                    >
                      {t("explorer.allTags")}
                    </Button>
                    {(tags ?? []).map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                        onClick={() => toggleTag(tag)}
                        className="rounded-full px-4"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>

                </div>

                {!explorerTemplates ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
                    ))}
                  </div>
                ) : explorerTemplates.length === 0 ? (
                  <EmptyState
                    icon={Compass}
                    title={t("explorer.emptyTitle")}
                    description={t("explorer.emptyDescription")}
                  />
                ) : (
                  <div className="space-y-4">
                    {explorerTemplates.map((template) => (
                      <TemplateCard
                        key={template._id}
                        template={template}
                        showClinicMarker
                        onClick={() => openTemplate(template, "explorer")}
                      />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="archived">
              <section className="rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-950">{t("archived.title")}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{t("archived.description")}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                    {t("archived.count", { count: archivedCount })}
                  </Badge>
                </div>

                {!archivedTemplates ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
                    ))}
                  </div>
                ) : archivedTemplates.length === 0 ? (
                  <EmptyState
                    icon={Archive}
                    title={t("archived.emptyTitle")}
                    description={t("archived.emptyDescription")}
                  />
                ) : (
                  <div className="space-y-4">
                    {archivedTemplates.map((template) => (
                      <TemplateCard
                        key={template._id}
                        template={template}
                        onClick={() => openTemplate(template, "archived")}
                      />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <QuestionnaireTemplateDialog
        open={!!selectedTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTemplate(null);
          }
        }}
        template={selectedTemplate}
        context={selectedContext}
      />
    </main>
  );
}
