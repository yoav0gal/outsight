"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Check, ChevronsUpDown, Form, Pin, Search, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { resolveLocalizedText, type LocalizedText } from "@/lib/templateEditor";

interface TemplateOption {
  _id: string;
  title: string;
  description?: string;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  isQuickAccess?: boolean;
  source?: "system" | "practitioner";
  statusBadge?: {
    label: string;
    tone: "active" | "archived";
  };
}

interface TemplateSearchPickerProps {
  options: TemplateOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  title: string;
  quickAccessLabel: string;
  systemLabel: string;
  customLabel: string;
}

export function TemplateSearchPicker({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  title,
  quickAccessLabel,
  systemLabel,
  customLabel,
}: TemplateSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const locale = useLocale();

  const selectedTemplate = options.find((option) => option._id === value);
  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) =>
      [
        resolveLocalizedText(locale, option.title, option.titleTranslations),
        resolveLocalizedText(locale, option.description, option.descriptionTranslations),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedSearch)
    );
  }, [locale, options, search]);

  const prioritizedOptions = useMemo(() => {
    const quickAccess = filteredOptions.filter((option) => option.isQuickAccess);
    const standard = filteredOptions.filter((option) => !option.isQuickAccess);

    return [...quickAccess, ...standard];
  }, [filteredOptions]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-auto min-h-12 w-full justify-between rounded-lg border-zinc-200 px-3 py-2 text-start"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm text-zinc-900">
            {selectedTemplate
              ? resolveLocalizedText(locale, selectedTemplate.title, selectedTemplate.titleTranslations)
              : placeholder}
          </span>
          {selectedTemplate?.isQuickAccess ? (
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"
              aria-label={quickAccessLabel}
              title={quickAccessLabel}
            >
              <Pin className="size-3" />
            </span>
          ) : null}
          {selectedTemplate?.statusBadge ? (
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                selectedTemplate.statusBadge.tone === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
              aria-label={selectedTemplate.statusBadge.label}
              title={selectedTemplate.statusBadge.label}
            >
              {selectedTemplate.source === "practitioner" ? (
                <PencilLine className="size-3" />
              ) : (
                <Form className="size-3" />
              )}
            </span>
          ) : null}
        </span>
        <ChevronsUpDown className="size-4 text-zinc-400" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(32rem,calc(100%-2rem))] rounded-[1.5rem] border-none p-0 shadow-2xl">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <DialogHeader className="gap-1">
              <DialogTitle className="text-base font-semibold text-zinc-950">
                {title}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 sm:px-6">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 rounded-xl border-zinc-200 bg-white ps-9 text-sm"
              />
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto px-3 pb-3 sm:px-4 sm:pb-4">
            {prioritizedOptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                {emptyLabel}
              </div>
            ) : (
              <div className="space-y-2">
                {prioritizedOptions.map((option) => {
                  const isSelected = option._id === value;

                  return (
                    <PickerOption
                      key={option._id}
                      option={option}
                      locale={locale}
                      quickAccessLabel={quickAccessLabel}
                      systemLabel={systemLabel}
                      customLabel={customLabel}
                      isSelected={isSelected}
                      onSelect={() => {
                        onChange(option._id);
                        setOpen(false);
                        setSearch("");
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PickerOption({
  option,
  locale,
  quickAccessLabel,
  systemLabel,
  customLabel,
  isSelected,
  onSelect,
}: {
  option: TemplateOption;
  locale: string;
  quickAccessLabel: string;
  systemLabel: string;
  customLabel: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const title = resolveLocalizedText(locale, option.title, option.titleTranslations);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-start transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
          isSelected
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-zinc-300 bg-white text-transparent"
        }`}
      >
        <Check className="size-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block truncate text-sm font-semibold text-zinc-900">
            {title}
          </span>
          {option.isQuickAccess ? (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"
              aria-label={quickAccessLabel}
              title={quickAccessLabel}
            >
              <Pin className="size-3" />
            </span>
          ) : null}
          {option.source === "practitioner" ? (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
              aria-label={customLabel}
              title={customLabel}
            >
              <PencilLine className="size-3" />
            </span>
          ) : (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-700"
              aria-label={systemLabel}
              title={systemLabel}
            >
              <Form className="size-3" />
            </span>
          )}
          {option.statusBadge ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                option.statusBadge.tone === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {option.statusBadge.label}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
