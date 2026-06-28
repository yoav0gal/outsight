"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  BellRing,
  Chrome,
  KeyRound,
  Link as LinkIcon,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

export default function PractitionerMyPatients() {
  const patients = useQuery(api.users.listPatients);
  const createInvite = useMutation(api.invites.create);
  const [inviteLink, setInviteLink] = useState<{ url: string; mode: "patient_credentials" | "workos" | "link_only" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [inviteMode, setInviteMode] = useState<"patient_credentials" | "workos" | "link_only">("workos");
  const [search, setSearch] = useState("");
  const t = useTranslations("PractitionerMyPatients");

  const filteredPatients = useMemo(() => {
    if (!patients) {
      return [];
    }

    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return patients;
    }

    return patients.filter((patient) => {
      const name = patient.name?.toLocaleLowerCase() ?? "";
      const accountName = patient.accountName?.toLocaleLowerCase() ?? "";
      const email = patient.email?.toLocaleLowerCase() ?? "";
      const username = patient.loginIdentifier?.toLocaleLowerCase() ?? "";
      return (
        name.includes(normalizedSearch) ||
        accountName.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        username.includes(normalizedSearch)
      );
    });
  }, [patients, search]);

  const handleGenerateInvite = async () => {
    const normalizedPatientName = patientName.trim();
    if (!normalizedPatientName) {
      return;
    }

    setLoading(true);
    try {
      const invitation = await createInvite({
        patientName: normalizedPatientName,
        mode: inviteMode,
        email: patientEmail.trim() || undefined,
      });
      const baseUrl = window.location.origin;
      setInviteLink({ url: `${baseUrl}/join?token=${invitation.token}`, mode: invitation.mode });
      setPatientName("");
      setPatientEmail("");
      setInviteMode("workos");
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert(t("failedInvite"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">{t("myPatients")}</h1>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            disabled={loading}
            size="lg"
            className="flex items-center gap-2 self-start rounded-2xl font-bold shadow-md shadow-indigo-100 lg:self-auto"
          >
            <UserPlus className="w-5 h-5" />
            {t("addPatient")}
          </Button>
        </div>

        {inviteLink && (
          <div className="animate-in fade-in slide-in-from-top-4 rounded-[1.75rem] border border-indigo-100 bg-[linear-gradient(180deg,rgba(238,242,255,0.95),rgba(255,255,255,0.98))] p-6 duration-300">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-indigo-900">
              <LinkIcon className="w-4 h-4" />
              {inviteLink.mode === "link_only"
                ? t("linkOnlyInviteTitle")
                : inviteLink.mode === "patient_credentials"
                  ? t("inviteCodeTitle")
                  : t("regularInviteTitle")}
            </h3>
            <p className="mb-4 text-sm text-indigo-700">
              {inviteLink.mode === "link_only"
                ? t("linkOnlyInviteDesc")
                : inviteLink.mode === "patient_credentials"
                  ? t("inviteCodeDesc")
                  : t("regularInviteDesc")}
            </p>
            <div className="flex flex-col gap-2 text-start sm:flex-row sm:items-center">
              <Input 
                readOnly 
                value={inviteLink.url}
                dir="ltr"
                className="flex-1 rounded-lg border-indigo-200 bg-white text-sm text-zinc-900 text-start focus:ring-indigo-500"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink.url);
                  alert(t("copiedText"));
                }}
                className="rounded-xl border-indigo-200 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-50"
              >
                {t("copy")}
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-12 w-full rounded-2xl border-zinc-200 bg-white ps-11 text-start shadow-sm focus-visible:ring-indigo-500"
          />
        </div>

        <div className="grid gap-4">
          {!patients ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-[1.75rem] border-zinc-100 shadow-sm">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex w-full items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white py-20 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
              <h3 className="mb-2 text-xl font-bold text-zinc-900">{t("noPatients")}</h3>
              <p className="mx-auto max-w-sm text-zinc-500">{t("noPatientsDesc")}</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white py-20 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
              <h3 className="mb-2 text-xl font-bold text-zinc-900">{t("searchEmpty")}</h3>
            </div>
          ) : (
            filteredPatients.map((patient, index) => (
              <Link key={patient._id} href={`/practitioner/patient/${patient._id}`}>
                <Card 
                  className="group overflow-hidden rounded-[1.9rem] border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    borderInlineStartColor:
                      index % 3 === 0
                        ? "rgb(129 140 248)"
                        : index % 3 === 1
                          ? "rgb(52 211 153)"
                          : "rgb(251 191 36)",
                    borderInlineStartWidth: "6px",
                  }}
                >
                  <CardContent className="flex items-center justify-between gap-4 p-6 text-start">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg uppercase"
                        style={{
                          background:
                            index % 3 === 0
                              ? "color-mix(in oklab, rgb(99 102 241) 12%, white)"
                              : index % 3 === 1
                                ? "color-mix(in oklab, rgb(16 185 129) 12%, white)"
                                : "color-mix(in oklab, rgb(245 158 11) 14%, white)",
                          color:
                            index % 3 === 0
                              ? "rgb(67 56 202)"
                              : index % 3 === 1
                                ? "rgb(4 120 87)"
                                : "rgb(180 83 9)",
                        }}
                      >
                        {patient.name?.charAt(0) || "P"}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-950">{patient.name || t("unnamedPatient")}</h4>
                          {patient.unreadEntries ? (
                            <Badge className="ms-auto rounded-full border-none bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-800 hover:bg-amber-100">
                              <BellRing className="me-1 h-3 w-3" />
                              {t("newEntries", { count: patient.unreadEntries })}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-zinc-500">{patient.email ?? patient.loginIdentifier ?? t("anonymousPatient")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{t("activeStatus")}</span>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setPatientName("");
            setPatientEmail("");
            setInviteMode("workos");
          }
        }}>
          <DialogContent className="overflow-hidden rounded-[1.9rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.94))] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:max-w-xl">
            <div className="space-y-6 p-6 sm:p-7">
              <DialogHeader className="text-start">
                <DialogTitle className="text-2xl font-black tracking-tight text-zinc-950">{t("inviteDialog.title")}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <Label htmlFor="patient-name" className="text-sm font-semibold text-zinc-900">
                  {t("inviteDialog.patientNameLabel")}
                </Label>
                <Input
                  id="patient-name"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  placeholder={t("inviteDialog.patientNamePlaceholder")}
                  className="h-12 rounded-2xl border-zinc-200 bg-white text-base shadow-sm focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="patient-email" className="text-sm font-semibold text-zinc-900">
                  {t("inviteDialog.patientEmailLabel")}
                </Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={patientEmail}
                  onChange={(event) => setPatientEmail(event.target.value)}
                  placeholder={t("inviteDialog.patientEmailPlaceholder")}
                  className="h-12 rounded-2xl border-zinc-200 bg-white text-base shadow-sm focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-zinc-900">{t("inviteDialog.accountTypeLabel")}</Label>
                <RadioGroup
                  value={inviteMode}
                  onValueChange={(value) => setInviteMode(value as "patient_credentials" | "workos" | "link_only")}
                  className="grid gap-3"
                >
                  <label
                    htmlFor="invite-mode-workos"
                    className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[1.5rem] border p-4 text-start shadow-sm transition-all ${
                      inviteMode === "workos"
                        ? "border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-100"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        inviteMode === "workos"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      <Chrome className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-zinc-950">{t("inviteDialog.options.quickAccess.title")}</p>
                        <Badge className="rounded-full border-0 bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 hover:bg-emerald-100">
                          {t("inviteDialog.options.quickAccess.badge")}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-zinc-500">{t("inviteDialog.options.quickAccess.description")}</p>
                    </div>
                    <RadioGroupItem value="workos" id="invite-mode-workos" className="mt-1" />
                  </label>

                  <label
                    htmlFor="invite-mode-password"
                    className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[1.5rem] border p-4 text-start shadow-sm transition-all ${
                      inviteMode === "patient_credentials"
                        ? "border-zinc-300 bg-white ring-1 ring-zinc-100"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        inviteMode === "patient_credentials"
                          ? "bg-zinc-100 text-zinc-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-950">{t("inviteDialog.options.password.title")}</p>
                      <p className="text-sm leading-6 text-zinc-500">{t("inviteDialog.options.password.description")}</p>
                    </div>
                    <RadioGroupItem value="patient_credentials" id="invite-mode-password" className="mt-1" />
                  </label>

                  <label
                    htmlFor="invite-mode-link-only"
                    className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[1.5rem] border p-4 text-start shadow-sm transition-all ${
                      inviteMode === "link_only"
                        ? "border-zinc-300 bg-white ring-1 ring-zinc-100"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        inviteMode === "link_only"
                          ? "bg-zinc-100 text-zinc-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      <LinkIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-950">{t("inviteDialog.options.linkOnly.title")}</p>
                      <p className="text-sm leading-6 text-zinc-500">{t("inviteDialog.options.linkOnly.description")}</p>
                    </div>
                    <RadioGroupItem value="link_only" id="invite-mode-link-only" className="mt-1" />
                  </label>
                </RadioGroup>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-2xl border-zinc-200">
                  {t("inviteDialog.cancel")}
                </Button>
                <Button onClick={handleGenerateInvite} disabled={loading || !patientName.trim()} className="rounded-2xl px-5">
                  {loading ? t("inviteDialog.creating") : t("inviteDialog.submit")}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </main>
  );
}
