"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { resolveLocalizedText } from "@/lib/templateEditor";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function PatientHomeContent() {
  const user = useQuery(api.users.viewer);
  const pendingInstances = useQuery(
    api.questionnaires.listPendingInstances,
    user && user.role === "patient" ? {} : "skip",
  );
  const assignments = useQuery(
    api.questionnaires.listPatientAssignments,
    user && user.role === "patient" ? { patientId: user._id } : "skip"
  );
  const createOnDemandMutation = useMutation(api.questionnaires.createPatientOnDemandInstance);
  
  const [isCreatingOnDemand, setIsCreatingOnDemand] = useState<Record<string, boolean>>({});

  const t = useTranslations("PatientHome");
  const tP = useTranslations("PractitionerPatient");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const noRedirect = searchParams.get("noRedirect") === "true";

  const isLinkOnly = user?.authType === "link_only";

  useEffect(() => {
    if (isLinkOnly && pendingInstances && pendingInstances.length > 0 && !noRedirect) {
      router.replace(`/patient/form/${pendingInstances[0]._id}`);
    }
  }, [isLinkOnly, pendingInstances, router, noRedirect]);

  if (isLinkOnly) {
    if (!pendingInstances) {
      return (
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </main>
      );
    }

    return (
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-12 flex flex-col gap-8">
        {pendingInstances.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-zinc-950 mb-3">{t("caughtUp")}</h3>
            <p className="text-zinc-500 text-sm font-semibold leading-relaxed max-w-[280px] mx-auto">
              {t("step1") || "You have completed all assigned questionnaires. Thank you!"}
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                {t("availableForYou") || "Available for you"}
              </h2>
              <span className="bg-indigo-600 text-white text-xs py-1 px-3 rounded-full font-black shadow-md shadow-indigo-100">
                {pendingInstances.length}
              </span>
            </div>

            <div className="grid gap-4">
              {pendingInstances.map((instance) => {
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
              })}
            </div>
          </section>
        )}

        {/* Assignments list for link-only patient */}
        <section className="flex flex-col gap-6">
          <div className="px-2">
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              {t("myQuestionnaires") || "My Questionnaires"}
            </h2>
          </div>

          <div className="grid gap-4">
            {!assignments ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border-zinc-200/60 shadow-sm rounded-[2rem] animate-pulse">
                  <CardContent className="p-8 h-24 bg-zinc-100/50"></CardContent>
                </Card>
              ))
            ) : assignments.length === 0 ? (
              <div className="bg-white border border-zinc-100 rounded-[2.5rem] py-8 text-center flex flex-col items-center justify-center">
                <p className="text-zinc-500 text-sm font-medium">No questionnaires assigned.</p>
              </div>
            ) : (
              assignments
                .filter(a => a.status === "active")
                .map((assignment) => {
                  const tpl = assignment.template;
                  const title = tpl ? resolveLocalizedText(locale, tpl.title, tpl.titleTranslations) : "";
                  
                  // Check if submitted today
                  const submittedToday = assignment.lastSubmittedAt !== undefined && (() => {
                    const date = new Date(assignment.lastSubmittedAt);
                    const today = new Date();
                    return (
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear()
                    );
                  })();

                  const handleCreateOnDemand = async () => {
                    setIsCreatingOnDemand(prev => ({ ...prev, [assignment._id]: true }));
                    try {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const localStartOfDay = today.getTime();

                      const instanceId = await createOnDemandMutation({
                        assignmentId: assignment._id,
                        localStartOfDay,
                      });

                      router.push(`/patient/form/${instanceId}`);
                    } catch (error) {
                      console.error("Failed to create on-demand questionnaire instance:", error);
                    } finally {
                      setIsCreatingOnDemand(prev => ({ ...prev, [assignment._id]: false }));
                    }
                  };

                  return (
                    <Card key={assignment._id} className="group border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all rounded-[2rem] overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-lg font-black text-zinc-900 truncate text-start">
                          {title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-0.5 rounded-md uppercase">
                            {tP(`questionnaires.frequency.${assignment.frequency}`) || assignment.frequency}
                          </span>
                          {submittedToday && (
                            <span className="bg-green-50 text-green-700 text-xs font-black px-2.5 py-0.5 rounded-md">
                              {t("completedToday") || "Completed today"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {assignment.lastCompletedInstanceId && (
                          <Link href={`/patient/form/${assignment.lastCompletedInstanceId}`} className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl font-bold border-zinc-200 hover:bg-zinc-50 text-zinc-800 shadow-none">
                              {t("editAnswers") || "Edit Answers"}
                            </Button>
                          </Link>
                        )}
                        <Button
                          disabled={submittedToday || !!isCreatingOnDemand[assignment._id]}
                          onClick={handleCreateOnDemand}
                          className="w-full sm:w-auto h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:border-zinc-200 disabled:shadow-none"
                        >
                          {isCreatingOnDemand[assignment._id] ? "..." : (submittedToday ? t("completedToday") : (t("fillNewEntry") || "Fill Again"))}
                        </Button>
                      </div>
                    </Card>
                  );
                })
            )}
          </div>
        </section>
      </main>
    );
  }

  const patientDisplayName = user?.accountName ?? user?.loginIdentifier ?? user?.name;

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-12 flex flex-col gap-8">
      <div className="pt-3">
        <h1 className="text-4xl font-black text-zinc-950 tracking-tight">
          {t("hi", { name: patientDisplayName || t("defaultName") })}
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

      {/* My Questionnaires Section */}
      <section className="flex flex-col gap-6">
        <div className="px-2">
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            {t("myQuestionnaires") || "My Questionnaires"}
          </h2>
        </div>

        <div className="grid gap-4">
          {!assignments ? (
            // Loading
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-zinc-200/60 shadow-sm rounded-[2rem] animate-pulse">
                <CardContent className="p-8 h-24 bg-zinc-100/50"></CardContent>
              </Card>
            ))
          ) : assignments.length === 0 ? (
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] py-8 text-center flex flex-col items-center justify-center">
              <p className="text-zinc-500 text-sm font-medium">No questionnaires assigned.</p>
            </div>
          ) : (
            assignments
              .filter(a => a.status === "active")
              .map((assignment) => {
                const tpl = assignment.template;
                const title = tpl ? resolveLocalizedText(locale, tpl.title, tpl.titleTranslations) : "";
                
                // Check if submitted today
                const submittedToday = assignment.lastSubmittedAt !== undefined && (() => {
                  const date = new Date(assignment.lastSubmittedAt);
                  const today = new Date();
                  return (
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear()
                  );
                })();

                const handleCreateOnDemand = async () => {
                  setIsCreatingOnDemand(prev => ({ ...prev, [assignment._id]: true }));
                  try {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const localStartOfDay = today.getTime();

                    const instanceId = await createOnDemandMutation({
                      assignmentId: assignment._id,
                      localStartOfDay,
                    });

                    router.push(`/patient/form/${instanceId}`);
                  } catch (error) {
                    console.error("Failed to create on-demand questionnaire instance:", error);
                  } finally {
                    setIsCreatingOnDemand(prev => ({ ...prev, [assignment._id]: false }));
                  }
                };

                return (
                  <Card key={assignment._id} className="group border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all rounded-[2rem] overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="text-lg font-black text-zinc-900 truncate">
                        {title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-0.5 rounded-md uppercase">
                          {tP(`questionnaires.frequency.${assignment.frequency}`) || assignment.frequency}
                        </span>
                        {submittedToday && (
                          <span className="bg-green-50 text-green-700 text-xs font-black px-2.5 py-0.5 rounded-md">
                            {t("completedToday") || "Completed today"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {assignment.pendingInstanceId ? (
                        <Link href={`/patient/form/${assignment.pendingInstanceId}`} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                            {t("takeQuestionnaire")}
                            <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                          </Button>
                        </Link>
                      ) : (
                        <>
                          {assignment.lastCompletedInstanceId && (
                            <Link href={`/patient/form/${assignment.lastCompletedInstanceId}`} className="w-full sm:w-auto">
                              <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl font-bold border-zinc-200 hover:bg-zinc-50 text-zinc-800 shadow-none">
                                {t("editAnswers") || "Edit Answers"}
                              </Button>
                            </Link>
                          )}
                          <Button
                            disabled={submittedToday || !!isCreatingOnDemand[assignment._id]}
                            onClick={handleCreateOnDemand}
                            className="w-full sm:w-auto h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:border-zinc-200 disabled:shadow-none"
                          >
                            {isCreatingOnDemand[assignment._id] ? "..." : (submittedToday ? t("completedToday") : (t("fillNewEntry") || "Fill Again"))}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      </section>
    </main>
  );
}

export default function PatientHome() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </main>
    }>
      <PatientHomeContent />
    </Suspense>
  );
}
