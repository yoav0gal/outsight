"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLanguage } from "@/app/actions/language";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const toggleLanguage = () => {
    const nextLocale = locale === "he" ? "en" : "he";
    startTransition(() => {
      setLanguage(nextLocale);
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
      title={locale === "he" ? "Switch to English" : "החלף לעברית"}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{locale === "he" ? "En" : "He"}</span>
    </button>
  );
}
