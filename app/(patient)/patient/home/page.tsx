"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { LogOut, Heart, Smile } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PatientHome() {
  const { signOut } = useAuth();
  const user = useQuery(api.users.viewer);
  const t = useTranslations("PatientHome");

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Heart className="w-6 h-6" />
          <span>{t("title")}</span>
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 rtl:rotate-180" />
            {t("signOut")}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-8">
          <Smile className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-zinc-950 mb-4">
          {t("hi", { name: user?.name || t("defaultName") })}
        </h1>
        
        <p className="text-xl text-zinc-600 mb-12 max-w-md">
          {t("welcomeMessage")}
        </p>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm w-full">
          <h3 className="font-bold text-zinc-900 mb-2">{t("gettingStarted")}</h3>
          <p className="text-zinc-500 mb-6 italic">{t("gettingStartedQuote")}</p>
          <div className="grid gap-4 text-start">
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p className="text-sm text-zinc-700 font-medium">{t("step1")}</p>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-zinc-50 border border-zinc-100 opacity-50">
              <div className="w-6 h-6 bg-zinc-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p className="text-sm text-zinc-700 font-medium">{t("step2")}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
