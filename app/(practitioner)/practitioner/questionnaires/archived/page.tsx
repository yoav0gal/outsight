"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { Archive, ChevronRight, FileText, PencilLine } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { QuestionnaireTemplateDialog } from "@/components/practitioner/QuestionnaireTemplateDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  isQuickAccess?: boolean;
  archivedAt?: number;
};

function SectionShell({
  title,
  description,
  badge,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-zinc-200/70 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
              {badge}
            </div>
            {description ? <div className="max-w-3xl text-sm leading-6 text-zinc-500">{description}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function TemplateCard({
  template,
  onClick,
}: {
  template: TemplateItem;
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
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              template.source === "system" ? "bg-zinc-100 text-zinc-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {template.source === "system" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <PencilLine className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-start gap-2">
                <h3 className="line-clamp-1 text-base font-bold text-zinc-950">{title}</h3>
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700"
                >
                  <Archive className="me-1 size-3" />
                  {t("indicators.archived")}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
                {description || t("preview.noDescription")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                <FileText className="me-1 size-3.5" />
                {t("questionsCount", { count: template.questions.length })}
              </Badge>
            </div>
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

function TemplateListSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-[1.5rem]" />
      ))}
    </div>
  );
}

export default function ArchivedQuestionnairesPage() {
  const t = useTranslations("PractitionerQuestionnaires");
  const archivedTemplates = useQuery(api.questionnaires.listArchivedTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 sm:gap-8 sm:px-8 sm:py-8 lg:px-10">
      <section className="flex flex-col gap-4 rounded-[1.75rem] border border-zinc-200/70 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{t("archived.title")}</h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">{t("archived.description")}</p>
          </div>

          <Link href="/practitioner/questionnaires">
            <Button variant="outline" className="rounded-xl border-zinc-200">
              {t("title")}
            </Button>
          </Link>
        </div>
      </section>

      <SectionShell
        title={t("archived.title")}
        badge={
          <Badge variant="secondary" className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
            {t("archived.count", { count: archivedTemplates?.length ?? 0 })}
          </Badge>
        }
        description={t("archived.description")}
      >
        {!archivedTemplates ? (
          <TemplateListSkeleton count={2} />
        ) : archivedTemplates.length === 0 ? (
          <EmptyState
            icon={Archive}
            title={t("archived.emptyTitle")}
            description={t("archived.emptyDescription")}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {archivedTemplates.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        )}
      </SectionShell>

      <QuestionnaireTemplateDialog
        open={!!selectedTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTemplate(null);
          }
        }}
        template={selectedTemplate}
        context="archived"
      />
    </main>
  );
}
