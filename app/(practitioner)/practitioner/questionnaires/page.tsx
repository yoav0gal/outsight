"use client";

import { type ComponentType, type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  Form,
  PencilLine,
  Pin,
  PinOff,
  Plus,
  Layers3,
  Search,
  Filter,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuestionnaireTemplateDialog } from "@/components/practitioner/QuestionnaireTemplateDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  resolveLocalizedText,
  type LocalizedText,
  type TemplateQuestion,
} from "@/lib/templateEditor";

type TemplateItem = {
  _id: Id<"questionnaireTemplates">;
  title: string;
  description?: string;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  questions: TemplateQuestion[];
  source: "system" | "practitioner";
  isInClinic?: boolean;
  isQuickAccess?: boolean;
  archivedAt?: number;
};

type ExplorerSourceFilter = "all" | "system" | "practitioner";
type ExplorerStateFilter = "all" | "normalAccess" | "quickAccess";

function TemplateCard({
  template,
  onToggleQuickAccess,
  isTogglingQuickAccess,
  onClick,
}: {
  template: TemplateItem;
  onToggleQuickAccess: () => void;
  isTogglingQuickAccess: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("PractitionerQuestionnaires");
  const locale = useLocale();
  const title = resolveLocalizedText(locale, template.title, template.titleTranslations);
  const description = resolveLocalizedText(
    locale,
    template.description,
    template.descriptionTranslations
  );

  return (
    <Card
      className="group cursor-pointer rounded-[1.5rem] border-zinc-200/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50/50 -mt-3`}
          >
            {template.archivedAt ? (
              <Archive className="h-5 w-5" />
            ) : template.source === "system" ? (
              <Form className="h-5 w-5" />
            ) : (
              <PencilLine className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-base font-bold text-zinc-950">{title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  {t("questionsCount", { count: template.questions.length })}
                </span>
                {template.archivedAt ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <Archive className="size-3.5" />
                    {t("indicators.archived")}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
              {description || t("preview.noDescription")}
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleQuickAccess();
            }}
            disabled={!!template.archivedAt || isTogglingQuickAccess}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors -mt-2 ${
              template.isQuickAccess
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "border-zinc-200 bg-white text-zinc-300 hover:border-zinc-300 hover:text-zinc-600"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={template.isQuickAccess ? t("preview.removeFromQuickAccess") : t("preview.saveToQuickAccess")}
            aria-label={template.isQuickAccess ? t("preview.removeFromQuickAccess") : t("preview.saveToQuickAccess")}
          >
            <Pin className="h-4 w-4" />
          </button>
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
  icon: typeof Form;
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
  const [togglingTemplateId, setTogglingTemplateId] = useState<Id<"questionnaireTemplates"> | null>(
    null
  );

  const explorerTemplates = useQuery(api.questionnaires.listTemplatesExplorer, {
    search,
    source: sourceFilter,
    state: stateFilter,
  });
  const managedTemplates = useQuery(api.questionnaires.listClinicTemplates);
  const archivedTemplates = useQuery(api.questionnaires.listArchivedTemplates);
  const pinTemplateToQuickAccess = useMutation(api.questionnaires.pinTemplateToQuickAccess);
  const unpinTemplateFromQuickAccess = useMutation(api.questionnaires.unpinTemplateFromQuickAccess);

  const managedTemplateById = useMemo(() => {
    return new Map<Id<"questionnaireTemplates">, TemplateItem>(
      (managedTemplates ?? []).map((template) => [template._id, template])
    );
  }, [managedTemplates]);
  const archivedTemplateCount = archivedTemplates?.length ?? 0;

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

  const toggleQuickAccess = async (template: TemplateItem) => {
    if (template.archivedAt || togglingTemplateId) {
      return;
    }

    setTogglingTemplateId(template._id);
    try {
      if (template.isQuickAccess) {
        await unpinTemplateFromQuickAccess({
          templateId: template._id,
        });
      } else {
        await pinTemplateToQuickAccess({
          templateId: template._id,
        });
      }
    } finally {
      setTogglingTemplateId(null);
    }
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
            <FilterChip active={sourceFilter === "system"} onClick={() => setSourceFilter("system")} icon={Form}>
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
            <FilterChip active={stateFilter === "normalAccess"} onClick={() => setStateFilter("normalAccess")} icon={PinOff}>
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
                onToggleQuickAccess={() => toggleQuickAccess(template)}
                isTogglingQuickAccess={togglingTemplateId === template._id}
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
