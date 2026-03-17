"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { LogOut, Heart, Smile, FileText, ArrowRight, CheckCircle2, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function PatientHome() {
  const { signOut } = useAuth();
  const user = useQuery(api.users.viewer);
  const pendingInstances = useQuery(api.questionnaires.listPendingInstances);
  const t = useTranslations("PatientHome");

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sm:px-10 sm:py-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-black text-2xl text-indigo-600 tracking-tight">
          <Heart className="w-7 h-7" />
          <span>{t("title")}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/patient/history" className="hidden sm:flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors">
            <History className="w-4 h-4" />
            {t("history")}
          </Link>
          <LanguageSwitcher />
          <Button 
            variant="ghost"
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 rtl:rotate-180" />
            <span className="hidden sm:inline">{t("signOut")}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 sm:p-10 flex flex-col gap-12">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2.5rem] border border-indigo-100/50 shadow-sm">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <Smile className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-2 tracking-tight">
              {t("hi", { name: user?.name || t("defaultName") })}
            </h1>
            <p className="text-lg text-zinc-600">
              {t("welcomeMessage")}
            </p>
          </div>
        </div>

        {/* Pending Questionnaires */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-500" />
              {t("myQuestionnaires")}
            </h2>
            {pendingInstances && pendingInstances.length > 0 && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 rounded-full px-3 text-sm">
                {t("pendingQuestionnaires", { count: pendingInstances.length })}
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!pendingInstances ? (
              // Loading
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-zinc-200/60 shadow-sm rounded-[2rem] animate-pulse">
                  <CardContent className="p-8 h-48 bg-zinc-100/50"></CardContent>
                </Card>
              ))
            ) : pendingInstances.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-zinc-200 rounded-[2.5rem] py-20 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mb-6" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{t("caughtUp")}</h3>
                <p className="text-zinc-500 max-w-sm">
                  {t("step1")}
                </p>
              </div>
            ) : (
              pendingInstances.map((instance) => {
                const tpl = instance.template;
                return (
                  <Card key={instance._id} className="group border-zinc-200/60 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all rounded-[2rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-6 pb-4 bg-zinc-50/50 group-hover:bg-indigo-50/30 transition-colors">
                      <CardTitle className="text-lg font-bold text-zinc-900 line-clamp-1">
                        {tpl?.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-zinc-500">
                        {tpl?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-4 mt-auto">
                      <Link href={`/patient/form/${instance._id}`} className="block w-full">
                        <Button className="w-full rounded-xl font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 group-hover:bg-indigo-700 transition-colors">
                          {t("takeQuestionnaire")}
                          <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Mobile History Link */}
        <div className="sm:hidden flex justify-center mt-4">
          <Link href="/patient/history">
            <Button variant="outline" className="rounded-xl flex items-center gap-2 text-zinc-600">
              <History className="w-4 h-4" />
              {t("history")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}