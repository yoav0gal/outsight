"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface TemplateOption {
  _id: string;
  title: string;
  description?: string;
}

interface TemplateSearchPickerProps {
  options: TemplateOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  title: string;
  description: string;
}

export function TemplateSearchPicker({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  title,
  description,
}: TemplateSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedTemplate = options.find((option) => option._id === value);
  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return options;

    return options.filter((option) =>
      option.title.toLocaleLowerCase().includes(normalizedSearch)
    );
  }, [options, search]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-12 w-full justify-between rounded-lg border-zinc-200 px-3 text-start"
      >
        <span className="truncate text-sm text-zinc-900">
          {selectedTemplate?.title || placeholder}
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
              <DialogDescription className="text-sm text-zinc-500">
                {description}
              </DialogDescription>
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

          <div className="max-h-[20rem] overflow-y-auto px-3 pb-3 sm:px-4 sm:pb-4">
            {filteredOptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                {emptyLabel}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOptions.map((option) => {
                  const isSelected = option._id === value;

                  return (
                    <button
                      key={option._id}
                      type="button"
                      onClick={() => {
                        onChange(option._id);
                        setOpen(false);
                        setSearch("");
                      }}
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
                        <span className="block truncate text-sm font-semibold text-zinc-900">
                          {option.title}
                        </span>
                        {option.description ? (
                          <span className="mt-1 block text-sm text-zinc-500">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
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
