"use client";

import { type ComponentType, type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import {
  Archive,
  ChevronRight,
  FileText,
  Filter,
  PencilLine,
  Pin,
  Plus,
  Sparkles,
  Layers3,
  Search,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuestionnaireTemplateDialog } from "@/components/practitioner/QuestionnaireTemplateDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
  source: "system" | "practitioner";
  isInClinic?: boolean;
  isQuickAccess?: boolean;
  archivedAt?: number;
};

type ExplorerSourceFilter = "all" | "system" | "practitioner";
type ExplorerStateFilter = "all" | "normalAccess" | "quickAccess";

function TemplateCard({
  template,
  onClick,
}: {
  template: TemplateItem;
  onClick: () => void;
}) {
  const t = useTranslations("PractitionerQuestionnaires");

  return (
    <Card
      className="group cursor-pointer rounded-[1.5rem] border-zinc-200/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              template.archivedAt
                ? "bg-amber-50 text-amber-700"
                : template.isQuickAccess
                  ? "bg-indigo-50 text-indigo-700"
                  : template.source === "system"
                    ? "bg-zinc-100 text-zinc-700"
                    : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {template.archivedAt ? (
              <Archive className="h-5 w-5" />
            ) : template.isQuickAccess ? (
              <Pin className="h-5 w-5" />
            ) : template.source === "system" ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <PencilLine className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-base font-bold text-zinc-950">{template.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-1.5 rounded-full ${
                      template.source === "system" ? "bg-zinc-400" : "bg-emerald-500"
                    }`}
                  />
                  {template.source === "system" ? t("indicators.system") : t("indicators.custom")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  {t("questionsCount", { count: template.questions.length })}
                </span>
                {template.isQuickAccess ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-700">
                    <Pin className="size-3.5" />
                    {t("indicators.quickAccess")}
                  </span>
                ) : null}
                {template.archivedAt ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <Archive className="size-3.5" />
                    {t("indicators.archived")}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
              {template.description || t("preview.noDescription")}
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-colors group-hover:text-zinc-700">
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </div>
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
    <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-14 text-center">
      <Icon className="mx-auto mb-4 size-10 text-zinc-300" />
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function TemplateListSkeleton({ count, columns = false }: { count: number; columns?: boolean }) {
  return (
    <div className={columns ? "grid gap-3 lg:grid-cols-2" : "space-y-3"}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-[1.5rem]" />
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={`rounded-full px-4 ${active ? "bg-zinc-900 text-white hover:bg-zinc-800" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
    >
      {Icon ? <Icon className="me-2 size-3.5" /> : null}
      {children}
    </Button>
  );
}

export default function PractitionerQuestionnaires() {
  const t = useTranslations("PractitionerQuestionnaires");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ExplorerSourceFilter>("all");
  const [stateFilter, setStateFilter] = useState<ExplorerStateFilter>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [selectedContext, setSelectedContext] = useState<"explorer" | "archived">("explorer");

  const explorerTemplates = useQuery(api.questionnaires.listTemplatesExplorer, {
    search,
    source: sourceFilter,
    state: stateFilter,
  });
  const managedTemplates = useQuery(api.questionnaires.listClinicTemplates);

  const managedTemplateById = useMemo(() => {
    return new Map<Id<"questionnaireTemplates">, TemplateItem>(
      (managedTemplates ?? []).map((template) => [template._id, template])
    );
  }, [managedTemplates]);
  const archivedTemplateCount = (managedTemplates ?? []).filter((template) => template.archivedAt).length;

  const openTemplate = (
    template: TemplateItem,
    context: "explorer" | "archived"
  ) => {
    const managedVersion = managedTemplateById.get(template._id);
    setSelectedTemplate({
      ...template,
      isInClinic: managedVersion?.isInClinic ?? template.isInClinic,
      isQuickAccess: managedVersion?.isQuickAccess ?? template.isQuickAccess,
    });
    setSelectedContext(context);
  };

  const clearFilters = () => {
    setSearch("");
    setSourceFilter("all");
    setStateFilter("all");
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:gap-8 sm:px-8 sm:py-8 lg:px-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{t("title")}</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">{t("description")}</p>
          <Link
            href="/practitioner/questionnaires/archived"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <Archive className="size-4" />
            {archivedTemplateCount > 0
              ? t("actions.archivedQuestionnairesWithCount", { count: archivedTemplateCount })
              : t("actions.archivedQuestionnaires")}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/practitioner/questionnaires/new">
            <Button className="rounded-full bg-indigo-600 px-4 text-white hover:bg-indigo-500">
              <Plus className="me-2 size-4" />
              {t("actions.createOwnQuestionnaire")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-zinc-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-12 rounded-xl border-zinc-200 bg-white ps-9"
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={sourceFilter === "all"} onClick={() => setSourceFilter("all")} icon={Layers3}>
              {t("filters.allSources")}
            </FilterChip>
            <FilterChip active={sourceFilter === "system"} onClick={() => setSourceFilter("system")} icon={Sparkles}>
              {t("filters.sourceSystem")}
            </FilterChip>
            <FilterChip active={sourceFilter === "practitioner"} onClick={() => setSourceFilter("practitioner")} icon={PencilLine}>
              {t("filters.sourceCustom")}
            </FilterChip>
            <Button type="button" variant="ghost" onClick={clearFilters} className="ms-auto rounded-full px-3 text-zinc-500">
              {t("filters.clear")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <FilterChip active={stateFilter === "all"} onClick={() => setStateFilter("all")} icon={Filter}>
              {t("filters.allAccess")}
            </FilterChip>
            <FilterChip active={stateFilter === "normalAccess"} onClick={() => setStateFilter("normalAccess")} icon={Layers3}>
              {t("filters.normalAccess")}
            </FilterChip>
            <FilterChip active={stateFilter === "quickAccess"} onClick={() => setStateFilter("quickAccess")} icon={Pin}>
              {t("filters.stateQuickAccess")}
            </FilterChip>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {!explorerTemplates ? (
          <TemplateListSkeleton count={4} columns />
        ) : explorerTemplates.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("explorer.emptyTitle")}
            description={t("explorer.emptyDescription")}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {explorerTemplates.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                onClick={() => openTemplate(template, "explorer")}
              />
            ))}
          </div>
        )}
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
