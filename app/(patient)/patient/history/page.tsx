"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { History, FileText, Calendar, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { resolveLocalizedText } from "@/lib/templateEditor";
import { useEffect } from "react";
import { ClientDateTime } from "@/components/ui/clientDateTime";

export default function PatientHistoryPage() {
  const router = useRouter();
  const user = useQuery(api.users.viewer);
  const history = useQuery(
    api.questionnaires.listPatientHistory,
    user && user.role === "patient" ? {} : "skip",
  );
  const t = useTranslations("PatientHome");
  const tQ = useTranslations("Questionnaire");
  const locale = useLocale();

  useEffect(() => {
    if (user && user.authType === "link_only") {
      router.replace("/patient/home");
    }
  }, [user, router]);

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-12 flex flex-col gap-8">
      <header className="flex flex-col gap-1 px-2">
        <h1 className="text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-indigo-600" />
          {t("history")}
        </h1>
        <p className="text-zinc-500 font-medium">Your past questionnaire responses.</p>
      </header>

      <div className="grid gap-3">
        {!history ? (
          // Loading
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-zinc-100 shadow-sm rounded-2xl animate-pulse">
              <CardContent className="p-6 h-20 bg-zinc-50/50"></CardContent>
            </Card>
          ))
        ) : history.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-zinc-100 rounded-[2.5rem] py-20 text-center flex flex-col items-center justify-center">
            <History className="w-16 h-16 text-zinc-200 mb-4" />
            <p className="text-zinc-500 font-bold">{t("noHistory")}</p>
          </div>
        ) : (
          history.map((instance) => {
            const tpl = instance.template;
            const date = instance.submittedAt || instance.expiresAt || instance.createdAt;

            return (
              <Card 
                key={instance._id} 
                className="group border-none bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => router.push(`/patient/form/${instance._id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      instance.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-base line-clamp-1">
                        {tpl ? resolveLocalizedText(locale, tpl.title, tpl.titleTranslations) : ""}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <ClientDateTime 
                          date={date} 
                          mode="toLocaleDateString" 
                          options={{ year: 'numeric', month: 'short', day: 'numeric' }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${
                        instance.status === 'completed' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' 
                          : 'bg-red-100 text-red-700 hover:bg-red-100 border-none'
                      }`}
                    >
                      {tQ(`status.${instance.status}`)}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors rtl:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
