"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutList,
  Layers3,
  ListChecks,
  SlidersHorizontal,
  Table2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveLocalizedText, type TemplateQuestion } from "@/lib/templateEditor";
import { cn } from "@/lib/utils";

type QuestionnaireQuestion = TemplateQuestion;

export type QuestionnaireTemplate = {
  title: string;
  description?: string;
  titleTranslations?: {
    en?: string;
    he?: string;
  };
  descriptionTranslations?: {
    en?: string;
    he?: string;
  };
  tags?: string[];
  questions: QuestionnaireQuestion[];
};

type ViewMode = "slider" | "table" | "cards" | "grouped";

interface QuestionnaireVisualizationLabProps {
  template: QuestionnaireTemplate;
  backHref: string;
}

function localizePrompt(question: QuestionnaireQuestion, locale: string) {
  return resolveLocalizedText(locale, question.prompt, question.promptTranslations);
}

function localizeOptions(question: QuestionnaireQuestion, locale: string, sharedOptions: string[]) {
  const options = question.options?.length ? question.options : sharedOptions;

  if (!question.options?.length) {
    return options;
  }

  return options.map((option, index) =>
    resolveLocalizedText(locale, option, question.optionTranslations?.[index])
  );
}

function isSharedOptionSet(questions: QuestionnaireQuestion[]) {
  const firstOptions = questions.find((question) => question.options?.length)?.options;

  if (!firstOptions?.length) {
    return [];
  }

  const shared = questions.every((question) => {
    if (!question.options || question.options.length !== firstOptions.length) {
      return false;
    }

    return question.options.every((option, index) => option === firstOptions[index]);
  });

  return shared ? firstOptions : [];
}

function groupQuestions(questions: QuestionnaireQuestion[]) {
  const groups = new Map<string, Array<{ question: QuestionnaireQuestion; index: number }>>();

  questions.forEach((question, index) => {
    const [prefix] = question.prompt.split(":");
    const groupLabel = prefix?.trim() || question.id.split("_")[0] || "Other";

    const current = groups.get(groupLabel) ?? [];
    current.push({ question, index });
    groups.set(groupLabel, current);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function getSelectedIndex(questionIndex: number, optionsCount: number) {
  if (!optionsCount) {
    return 0;
  }

  return questionIndex % optionsCount;
}

function renderOptionStrip(
  options: string[],
  selectedIndex: number,
  emptyLabel: string,
  compact = false
) {
  if (!options.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-2",
        compact ? "text-[11px]" : "text-xs"
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, optionIndex) => {
        const isActive = optionIndex === selectedIndex;

        return (
          <div
            key={option}
            className={cn(
              "flex min-h-10 min-w-0 items-center justify-center rounded-full border px-2 py-2 text-center font-medium transition-colors",
              isActive
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                : "border-zinc-200 bg-white text-zinc-500"
            )}
          >
            <span className="block whitespace-normal break-words leading-snug">
              {option}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  sharedOptions,
  locale,
}: {
  question: QuestionnaireQuestion;
  index: number;
  sharedOptions: string[];
  locale: string;
}) {
  const t = useTranslations("Admin");
  const options = localizeOptions(question, locale, sharedOptions);
  const selectedIndex = getSelectedIndex(index, options.length);
  const selectedLabel = options[selectedIndex] ?? "";

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-zinc-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Badge
            variant="outline"
            className="mt-0.5 rounded-full border-zinc-200 bg-zinc-50 text-zinc-500"
          >
            {t("playground.question", { index: index + 1 })}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-6 text-zinc-950 whitespace-pre-wrap">
              {localizePrompt(question, locale)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {question.required && (
                <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-600">
                  {t("playground.required")}
                </span>
              )}
              {selectedLabel && (
                <span className="inline-flex max-w-full items-center rounded-full bg-indigo-50 px-2 py-1 font-medium text-indigo-700 whitespace-normal break-words leading-snug">
                  {t("playground.selected")}: {selectedLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sharedOptions.length > 0 ? (
            <Slider
              disabled
              value={[selectedIndex]}
              min={0}
              max={sharedOptions.length - 1}
              step={1}
              className="w-full"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
              {t("playground.uniqueAnswerSet")}
            </div>
          )}

          {renderOptionStrip(options, selectedIndex, t("playground.noOptions"))}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuestionnaireVisualizationLab({
  template,
  backHref,
}: QuestionnaireVisualizationLabProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [mode, setMode] = useState<ViewMode>("slider");

  const sharedOptions = useMemo(
    () => isSharedOptionSet(template.questions),
    [template.questions]
  );
  const groupedQuestions = useMemo(
    () => groupQuestions(template.questions),
    [template.questions]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(224,231,255,0.8),transparent_34%),linear-gradient(180deg,rgba(249,250,251,1),rgba(255,255,255,1))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,242,255,0.9))] shadow-sm">
          <div className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700">
                  {t("playground.eyebrow")}
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                    {t("playground.title")}
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
                    {t("playground.description")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={backHref}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "default",
                    }),
                    "rounded-xl border-zinc-200 bg-white"
                  )}
                >
                  {t("playground.back")}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-[1.5rem] border-zinc-200 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {t("playground.templateLabel")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {resolveLocalizedText(locale, template.title, template.titleTranslations)}
                  </p>
                  {template.description && (
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {resolveLocalizedText(
                        locale,
                        template.description,
                        template.descriptionTranslations
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] border-zinc-200 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {t("playground.questionCount", { count: template.questions.length })}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {template.questions.length}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{t("playground.mobileNote")}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] border-zinc-200 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {t("playground.optionCount", { count: sharedOptions.length })}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {sharedOptions.length}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{t("playground.sharedOptions")}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] border-zinc-200 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {t("playground.groupCount", { count: groupedQuestions.length })}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {groupedQuestions.length}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{t("playground.sampleLabel")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as ViewMode)}>
            <TabsList variant="line" className="w-full justify-start overflow-x-auto rounded-none">
              <TabsTrigger value="slider" className="gap-2 px-3 py-2 text-sm">
                <SlidersHorizontal className="size-4" />
                {t("playground.view.slider")}
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2 px-3 py-2 text-sm">
                <Table2 className="size-4" />
                {t("playground.view.table")}
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2 px-3 py-2 text-sm">
                <LayoutList className="size-4" />
                {t("playground.view.cards")}
              </TabsTrigger>
              <TabsTrigger value="grouped" className="gap-2 px-3 py-2 text-sm">
                <Layers3 className="size-4" />
                {t("playground.view.grouped")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="slider" className="mt-5">
              <div className="space-y-4">
                {template.questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    sharedOptions={sharedOptions}
                    locale={locale}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-5">
              <Card className="overflow-hidden rounded-[1.75rem] border-zinc-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="grid gap-4 p-4 sm:hidden">
                    {template.questions.map((question, index) => {
                      const options = localizeOptions(question, locale, sharedOptions);
                      const selectedIndex = getSelectedIndex(index, options.length);

                      return (
                        <div
                          key={question.id}
                          className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <Badge
                              variant="outline"
                              className="rounded-full border-zinc-200 bg-white text-zinc-500"
                            >
                              {t("playground.question", { index: index + 1 })}
                            </Badge>
                            <span className="inline-flex max-w-full rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 whitespace-normal break-words leading-snug">
                              {options[selectedIndex]}
                            </span>
                          </div>
                          <p className="text-sm font-semibold leading-6 text-zinc-950 whitespace-pre-wrap">
                            {localizePrompt(question, locale)}
                          </p>
                          {renderOptionStrip(options, selectedIndex, t("playground.noOptions"), true)}
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead className="bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        <tr>
                          <th className="border-b border-zinc-200 px-5 py-4">
                            {t("playground.questionColumn")}
                          </th>
                          <th className="border-b border-zinc-200 px-5 py-4">
                            {t("playground.options")}
                          </th>
                          <th className="border-b border-zinc-200 px-5 py-4">
                            {t("playground.selected")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {template.questions.map((question, index) => {
                          const options = localizeOptions(question, locale, sharedOptions);
                          const selectedIndex = getSelectedIndex(index, options.length);
                          const selectedLabel = options[selectedIndex] ?? "";

                          return (
                            <tr key={question.id} className="align-top">
                              <td className="border-b border-zinc-100 px-5 py-5">
                                <div className="space-y-2">
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-zinc-200 bg-zinc-50 text-zinc-500"
                                  >
                                    {t("playground.question", { index: index + 1 })}
                                  </Badge>
                                  <p className="text-sm font-semibold leading-6 text-zinc-950 whitespace-pre-wrap">
                                    {localizePrompt(question, locale)}
                                  </p>
                                </div>
                              </td>
                              <td className="border-b border-zinc-100 px-5 py-5">
                                {renderOptionStrip(options, selectedIndex, t("playground.noOptions"))}
                              </td>
                              <td className="border-b border-zinc-100 px-5 py-5">
                                <span className="inline-flex max-w-full rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 whitespace-normal break-words leading-snug">
                                  {selectedLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cards" className="mt-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {template.questions.map((question, index) => {
                  const options = localizeOptions(question, locale, sharedOptions);
                  const selectedIndex = getSelectedIndex(index, options.length);

                  return (
                    <Card
                      key={question.id}
                      className="rounded-[1.75rem] border-zinc-200 bg-white shadow-sm"
                    >
                      <CardHeader className="space-y-3 p-5 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant="outline"
                            className="rounded-full border-zinc-200 bg-zinc-50 text-zinc-500"
                          >
                            {t("playground.question", { index: index + 1 })}
                          </Badge>
                          <span className="inline-flex max-w-full items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 whitespace-normal break-words leading-snug">
                            {options[selectedIndex]}
                          </span>
                        </div>
                        <p className="text-base font-semibold leading-6 text-zinc-950 whitespace-pre-wrap">
                          {localizePrompt(question, locale)}
                        </p>
                      </CardHeader>
                      <CardContent className="px-5 pb-5 pt-0">
                        {renderOptionStrip(options, selectedIndex, t("playground.noOptions"))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="grouped" className="mt-5">
              <div className="grid gap-4 lg:grid-cols-2">
                      {groupedQuestions.map((group) => (
                  <Card
                    key={group.label}
                    className="overflow-hidden rounded-[1.75rem] border-zinc-200 bg-white shadow-sm"
                  >
                    <CardHeader className="border-b border-zinc-100 bg-zinc-50/70 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-zinc-950">
                            {group.label === "Other" ? t("playground.otherGroup") : group.label}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {t("playground.questionCount", { count: group.items.length })}
                          </p>
                        </div>
                        <Badge className="rounded-full bg-indigo-50 text-indigo-700">
                          <ListChecks className="size-3.5" />
                          {group.items.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5">
                      {group.items.map(({ question, index }) => {
                        const options = localizeOptions(question, locale, sharedOptions);
                        const selectedIndex = getSelectedIndex(index, options.length);

                        return (
                          <div
                            key={question.id}
                            className="rounded-2xl border border-zinc-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold leading-6 text-zinc-950 whitespace-pre-wrap">
                                {localizePrompt(question, locale)}
                              </p>
                              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="mt-3">
                              {renderOptionStrip(options, selectedIndex, t("playground.noOptions"), true)}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
