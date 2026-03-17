"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserMenu } from "@/components/UserMenu";
import { Heart, Smile, FileText, ArrowRight, CheckCircle2, History, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

export default function PatientHome() {
  const router = useRouter();
  const user = useQuery(api.users.viewer);
  const pendingInstances = useQuery(api.questionnaires.listPendingInstances);
  const history = useQuery(api.questionnaires.listPatientHistory, {});
  const t = useTranslations("PatientHome");
  const tQ = useTranslations("Questionnaire");

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sm:px-10 sm:py-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-black text-2xl text-indigo-600 tracking-tight">
          <Heart className="w-7 h-7" />
          <span>{t("title")}</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <UserMenu />
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

        {/* Questionnaires Section with Tabs */}
        <section className="flex flex-col gap-8">
          <Tabs defaultValue="pending" className="w-full">
            <div className="flex items-center justify-between mb-8 border-b border-zinc-200 pb-1 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start">
                <TabsTrigger 
                  value="pending" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-3 text-xl font-bold text-zinc-500 transition-all hover:text-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    {t("myQuestionnaires")}
                    {pendingInstances && pendingInstances.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 text-sm py-0.5 px-2.5 rounded-full font-bold">
                        {pendingInstances.length}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 pb-3 text-xl font-bold text-zinc-500 transition-all hover:text-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6" />
                    {t("history")}
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
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
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:outline-none">
              <div className="grid gap-4">
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
                    <p className="text-zinc-500 font-medium">{t("noHistory") || "No past responses found."}</p>
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
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}