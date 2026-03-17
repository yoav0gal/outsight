"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, FileText, History, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("PractitionerPatient");
  const tQ = useTranslations("Questionnaire");
  const tCT = useTranslations("CreateTemplate");
  const patientId = params.id as Id<"users">;

  const patient = useQuery(api.users.getPatient, { id: patientId });
  const assignments = useQuery(api.questionnaires.listPatientAssignments, { patientId });
  const templates = useQuery(api.questionnaires.listTemplates);
  const history = useQuery(api.questionnaires.listPatientHistory, { patientId });
  const assignMutation = useMutation(api.questionnaires.assign);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [selectedViewTemplate, setSelectedViewTemplate] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedFrequency, setSelectedFrequency] = useState<"once" | "daily" | "weekly">("weekly");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedTemplate) return;
    setIsAssigning(true);
    try {
      await assignMutation({
        patientId,
        templateId: selectedTemplate as Id<"questionnaireTemplates">,
        frequency: selectedFrequency,
      });
      setIsAssignOpen(false);
      setSelectedTemplate("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign questionnaire.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (patient === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Patient Not Found</h2>
        <Button onClick={() => router.back()} variant="outline">
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-6 sm:p-10">
        <div className="flex flex-col gap-6 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="w-fit flex items-center gap-2 text-zinc-500 hover:text-indigo-600 -ms-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("backToDashboard")}
          </Button>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-black shadow-inner">
              {patient.name?.charAt(0) || "P"}
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
                {patient.name || t("unnamed")}
              </h1>
              <p className="text-zinc-500 font-medium text-lg">{patient.email}</p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="questionnaires" dir="auto" className="w-full">
          <TabsList className="mb-8 bg-zinc-100 p-1.5 rounded-xl inline-flex w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-semibold">
              <User className="w-4 h-4 opacity-70" /> {t("tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-semibold">
              <History className="w-4 h-4 opacity-70" /> {t("tabs.history")}
            </TabsTrigger>
            <TabsTrigger value="questionnaires" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-semibold">
              <FileText className="w-4 h-4 opacity-70" /> {t("tabs.questionnaires")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-zinc-200/60 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-xl">{t("overview.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-zinc-500 text-center py-12">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Overview content will be implemented here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-zinc-200/60 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-zinc-500 text-center py-12">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>History content will be implemented here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questionnaires" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Active Prescriptions Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-zinc-900">{t("questionnaires.active")}</h2>
              
              <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogTrigger
                  render={
                    <Button size="lg" className="rounded-xl font-bold shadow-md shadow-indigo-100">
                      <FileText className="w-5 h-5 me-2" />
                      {t("questionnaires.assign")}
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{t("assignModal.title")}</DialogTitle>
                    <DialogDescription>
                      {t("assignModal.description")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template" className="text-sm font-semibold">{t("assignModal.template")}</Label>
                      <Select value={selectedTemplate} onValueChange={(val) => setSelectedTemplate(val || "")}>
                        <SelectTrigger id="template" className="rounded-lg h-12 border-zinc-200">
                          <SelectValue placeholder={t("assignModal.selectTemplate")}>
                            {(value: string) => templates?.find((tpl) => tpl._id === value)?.title || t("assignModal.selectTemplate")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {templates?.map((tpl) => (
                            <SelectItem key={tpl._id} value={tpl._id} className="rounded-lg">
                              {tpl.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="frequency" className="text-sm font-semibold">{t("assignModal.frequency")}</Label>
                      <Select value={selectedFrequency} onValueChange={(val: any) => setSelectedFrequency(val)}>
                        <SelectTrigger id="frequency" className="rounded-lg h-12 border-zinc-200">
                          <SelectValue>
                            {(value: string) => value ? t(`questionnaires.frequency.${value}`) : ""}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {(["once", "daily", "weekly"] as const).map((freq) => (
                            <SelectItem key={freq} value={freq} className="rounded-lg">
                              {t(`questionnaires.frequency.${freq}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="rounded-xl">
                      {t("assignModal.cancel")}
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedTemplate || isAssigning} className="rounded-xl">
                      {isAssigning ? "..." : t("assignModal.submit")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {!assignments ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-zinc-100 shadow-sm rounded-2xl">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-5 bg-zinc-100 rounded-md w-2/3 animate-pulse"></div>
                      <div className="h-4 bg-zinc-100 rounded-md w-1/3 animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              ) : assignments.length === 0 ? (
                <div className="col-span-full bg-white border border-dashed border-zinc-200 rounded-3xl py-16 text-center">
                  <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500 font-medium">{t("questionnaires.noActive")}</p>
                </div>
              ) : (
                assignments.map((assignment) => {
                  const tpl = templates?.find((t) => t._id === assignment.templateId);
                  return (
                    <Card 
                      key={assignment._id} 
                      className="border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow rounded-2xl cursor-pointer"
                      onClick={() => setSelectedViewTemplate(tpl)}
                    >
                      <CardContent className="p-6 flex flex-col items-start gap-4">
                        <div className="space-y-1 w-full text-start">
                          <h4 className="font-bold text-zinc-900 line-clamp-1">{tpl?.title || "Loading..."}</h4>
                          <p className="text-sm text-zinc-500 line-clamp-2">{tpl?.description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-auto w-full">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 capitalize rounded-lg">
                            {t(`questionnaires.frequency.${assignment.frequency}`)}
                          </Badge>
                          <Badge variant="outline" className="border-green-200 text-green-700 capitalize rounded-lg ms-auto">
                            {t(`questionnaires.status.${assignment.status}`)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Past Responses Section */}
            <div className="pt-8">
              <h3 className="text-xl font-bold text-zinc-900 mb-6">{t("questionnaires.history")}</h3>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!history ? (
                  // Loading Skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-zinc-100 shadow-sm rounded-2xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="h-5 bg-zinc-100 rounded-md w-2/3 animate-pulse"></div>
                        <div className="h-4 bg-zinc-100 rounded-md w-1/3 animate-pulse"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : history.length === 0 ? (
                  <div className="col-span-full bg-white border border-dashed border-zinc-200 rounded-3xl py-16 text-center">
                    <History className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">{t("questionnaires.noHistory")}</p>
                  </div>
                ) : (
                  history.map((instance) => {
                    const tpl = instance.template;
                    const date = new Date(instance.submittedAt || instance.createdAt).toLocaleDateString();
                    return (
                      <Card 
                        key={instance._id} 
                        className="border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow rounded-2xl cursor-pointer"
                        onClick={() => setSelectedSubmission(instance)}
                      >
                        <CardContent className="p-6 flex flex-col items-start gap-4">
                          <div className="space-y-1 w-full text-start">
                            <h4 className="font-bold text-zinc-900 line-clamp-1">{tpl?.title || "Unknown"}</h4>
                            <p className="text-sm text-zinc-500">{date}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-auto w-full">
                            <Badge 
                              variant="outline" 
                              className={`rounded-lg capitalize ${
                                instance.status === 'completed' 
                                  ? 'border-green-200 text-green-700' 
                                  : 'border-red-200 text-red-700'
                              }`}
                            >
                              {t(`questionnaires.status.${instance.status}`)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* View Template Dialog */}
            <Dialog open={!!selectedViewTemplate} onOpenChange={(open) => !open && setSelectedViewTemplate(null)}>
              <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[85vh] overflow-y-auto">
                {selectedViewTemplate && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl">{selectedViewTemplate.title}</DialogTitle>
                      <DialogDescription>
                        {selectedViewTemplate.description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {selectedViewTemplate.questions.map((q: any, i: number) => (
                        <div key={q.id} className="space-y-2">
                          <h4 className="font-semibold text-zinc-900 text-sm flex gap-2">
                            <span className="text-indigo-500">{i + 1}.</span> {q.prompt}
                        {q.required && <span className="text-red-500">*</span>}
                      </h4>
                      <div className="bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100 text-zinc-500 text-xs">
                        {tQ("type")}: <span className="font-mono">{tCT(`types.${q.type}`)}</span>
                        {q.options && (
                          <div className="mt-2 space-y-1">
                            <p className="font-semibold text-[10px] uppercase tracking-wider text-zinc-400">{tQ("options")}:</p>
                            <div className="flex flex-wrap gap-1">
                              {q.options.map((opt: string, j: number) => (
                                <span key={j} className="bg-white px-2 py-0.5 rounded border border-zinc-200">{opt}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                      ))}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* View Submission Dialog */}
            <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
              <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[85vh] overflow-y-auto">
                {selectedSubmission && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-xl">{selectedSubmission.template?.title}</DialogTitle>
                      <DialogDescription>
                        {tQ("submittedOn", { date: new Date(selectedSubmission.submittedAt || selectedSubmission.createdAt).toLocaleString() })}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {selectedSubmission.template?.questions.map((q: any, i: number) => {
                        const ans = selectedSubmission.answers?.find((a: any) => a.questionId === q.id)?.value;
                        return (
                          <div key={q.id} className="space-y-2">
                            <h4 className="font-semibold text-zinc-900 text-sm flex gap-2">
                              <span className="text-indigo-500">{i + 1}.</span> {q.prompt}
                            </h4>
                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-zinc-700 text-sm">
                              {ans !== undefined ? String(ans) : <span className="text-zinc-400 italic">No answer provided</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
  );
}