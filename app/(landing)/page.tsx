"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { SyncUser } from "@/components/SyncUser";
import { Suspense } from "react";
import { ArrowRight, ArrowLeft, ClipboardCheck, Users, ShieldCheck, Signpost } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-indigo-600">
          <Signpost className="w-8 h-8" />
          <span>{t("title")}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">{t("features")}</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">{t("pricing")}</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">{t("about")}</a>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <LanguageSwitcher />
              <Link 
                href="/sign-in" 
                className={cn(buttonVariants({ variant: "default", size: "default" }), "rounded-full font-semibold shadow-md shadow-indigo-100")}
              >
                {t("logIn")}
              </Link>
            </>
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
            className={cn(buttonVariants({ size: "lg" }), "bg-zinc-950 hover:bg-zinc-800 rounded-2xl text-lg font-bold group h-auto py-4 px-8")}
          >
            {t("startForFree")}
            {/* Standard arrow pushing in correct inline direction */}
            <div className="w-5 h-5 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180">
              <ArrowRight className="w-full h-full" />
            </div>
          </Link>
          <a 
            href="#demo" 
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white text-zinc-950 border-zinc-200 rounded-2xl text-lg font-bold hover:bg-zinc-50 shadow-sm h-auto py-4 px-8")}
          >
            {t("bookDemo")}
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full">
          <Card className="border-zinc-100 shadow-sm text-start bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">{t("feature1Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600">{t("feature1Desc")}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-100 shadow-sm text-start bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-2">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">{t("feature2Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600">{t("feature2Desc")}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-100 shadow-sm text-start bg-white">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">{t("feature3Title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600">{t("feature3Desc")}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-10 border-t border-zinc-200 text-center text-zinc-500 text-sm">
        {t("footer")}
      </footer>
    </div>
  );
}
