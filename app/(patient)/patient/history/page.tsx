"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, History, FileText, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientHistoryPage() {
  const router = useRouter();
  const t = useTranslations("PatientHome");
  const tQ = useTranslations("Questionnaire");
  const history = useQuery(api.questionnaires.listPatientHistory, {});

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="w-fit flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors -ms-4"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        </Button>
        <div className="flex items-center gap-2 font-bold text-lg text-zinc-900">
          <History className="w-5 h-5 text-indigo-500" />
          <span>{t("history")}</span>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 sm:p-10 flex flex-col gap-8">
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">
            {t("history")}
          </h1>
          {history && (
            <Badge variant="secondary" className="bg-zinc-200 text-zinc-700 rounded-full">
              {history.length}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
          {!history ? (
            // Loading
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-zinc-200/60 shadow-sm rounded-2xl animate-pulse">
                <CardContent className="p-6 h-24 bg-zinc-100/50"></CardContent>
              </Card>
            ))
          ) : history.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-zinc-200 rounded-[2.5rem] py-20 text-center flex flex-col items-center justify-center">
              <History className="w-12 h-12 text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">No past questionnaires found.</p>
            </div>
          ) : (
            history.map((instance) => {
              const tpl = instance.template;
              const date = instance.submittedAt || instance.expiresAt || instance.createdAt;
              const dateObj = new Date(date);
              const formattedDate = dateObj.toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });

              return (
                <Card 
                  key={instance._id} 
                  className={`border-zinc-200/60 shadow-sm rounded-2xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 transition-all hover:shadow-md cursor-pointer ${
                    instance.status === 'completed' ? 'hover:border-green-200' : 'hover:border-red-200'
                  }`}
                  onClick={() => router.push(`/patient/form/${instance._id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      instance.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-lg">{tpl?.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                        <Calendar className="w-4 h-4 opacity-70" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    className={`rounded-lg capitalize whitespace-nowrap ${
                      instance.status === 'completed' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {tQ(`status.${instance.status}`)}
                  </Badge>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}