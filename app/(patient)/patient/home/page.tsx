"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { resolveLocalizedText } from "@/lib/templateEditor";

export default function PatientHome() {
  const user = useQuery(api.users.viewer);
  const pendingInstances = useQuery(api.questionnaires.listPendingInstances);
  const t = useTranslations("PatientHome");
  const locale = useLocale();

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-12 flex flex-col gap-8">
      <div className="pt-3">
        <h1 className="text-4xl font-black text-zinc-950 tracking-tight">
          {t("hi", { name: user?.name || t("defaultName") })}
        </h1>
      </div>

      {/* Questionnaires Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            {t("availableForYou")}
          </h2>
          {pendingInstances && pendingInstances.length > 0 && (
            <span className="bg-indigo-600 text-white text-xs py-1 px-3 rounded-full font-black shadow-md shadow-indigo-100">
              {pendingInstances.length}
            </span>
          )}
        </div>

        <div className="grid gap-4">
          {!pendingInstances ? (
            // Loading
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-zinc-200/60 shadow-sm rounded-[2rem] animate-pulse">
                <CardContent className="p-8 h-32 bg-zinc-100/50"></CardContent>
              </Card>
            ))
          ) : pendingInstances.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-100 rounded-[2.5rem] py-16 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{t("caughtUp")}</h3>
              <p className="text-zinc-500 max-w-[240px] text-sm font-medium">
                {t("step1")}
              </p>
            </div>
          ) : (
            pendingInstances.map((instance) => {
              const tpl = instance.template;
              return (
                <Card key={instance._id} className="group border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all rounded-[2rem] overflow-hidden flex flex-col">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-xl font-black text-zinc-900 line-clamp-1">
                      {tpl ? resolveLocalizedText(locale, tpl.title, tpl.titleTranslations) : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 mt-auto">
                    <Link href={`/patient/form/${instance._id}`} className="block w-full">
                      <Button className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group-hover:bg-indigo-700 transition-colors bg-indigo-600">
                        {t("takeQuestionnaire")}
                        <ArrowRight className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
