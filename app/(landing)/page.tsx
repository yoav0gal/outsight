"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { SyncUser } from "@/components/SyncUser";
import { Suspense } from "react";
import { ArrowRight, ArrowLeft, ClipboardCheck, Users, ShieldCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LandingPage() {
  const { user } = useAuth();
  const t = useTranslations("LandingPage");
  const locale = useLocale();

  // Determine direction dynamically to support any new RTL languages added in the future
  const isRtl = (new Intl.Locale(locale) as any).getTextInfo?.().direction === 'rtl';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900">
      <Suspense fallback={null}>
        <SyncUser />
      </Suspense>

      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-indigo-600">
          <ClipboardCheck className="w-8 h-8" />
          <span>{t("title")}</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">{t("features")}</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">{t("pricing")}</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">{t("about")}</a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <Link 
              href="/dashboard" 
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              {t("goToDashboard")}
            </Link>
          ) : (
            <Link 
              href="/sign-in" 
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              {t("logIn")}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-950 mb-6">
          {t("heroTitleLine1")} <br />
          <span className="text-indigo-600">{t("heroTitleLine2")}</span>
        </h1>
        <p className="text-xl text-zinc-600 mb-10 max-w-2xl leading-relaxed">
          {t("heroSubtitle")}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link 
            href="/sign-in" 
            className="flex items-center justify-center gap-2 bg-zinc-950 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-zinc-800 transition-all group"
          >
            {t("startForFree")}
            {/* Standard arrow pushing in correct inline direction */}
            <div className="w-5 h-5 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180">
              <ArrowRight className="w-full h-full" />
            </div>
          </Link>
          <a 
            href="#demo" 
            className="flex items-center justify-center bg-white text-zinc-950 border border-zinc-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-zinc-50 transition-all shadow-sm"
          >
            {t("bookDemo")}
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full">
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-start">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature1Title")}</h3>
            <p className="text-zinc-600">{t("feature1Desc")}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-start">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature2Title")}</h3>
            <p className="text-zinc-600">{t("feature2Desc")}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-start">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature3Title")}</h3>
            <p className="text-zinc-600">{t("feature3Desc")}</p>
          </div>
        </div>
      </main>

      <footer className="py-10 border-t border-zinc-200 text-center text-zinc-500 text-sm">
        {t("footer")}
      </footer>
    </div>
  );
}
