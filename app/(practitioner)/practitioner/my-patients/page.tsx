"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserPlus, Users, Link as LinkIcon, ArrowRight, Search, BellRing } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PractitionerMyPatients() {
  const patients = useQuery(api.users.listPatients);
  const createInvite = useMutation(api.invites.create);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      const email = patient.email.toLocaleLowerCase();
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [patients, search]);

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const token = await createInvite({});
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/join?token=${token}`);
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
            onClick={handleGenerateInvite}
            disabled={loading}
            size="lg"
            className="flex items-center gap-2 self-start rounded-2xl font-bold shadow-md shadow-indigo-100 lg:self-auto"
          >
            <UserPlus className="w-5 h-5" />
            {t("addPatient")}
          </Button>
        </div>

        {inviteLink && (
          <div className="animate-in fade-in slide-in-from-top-4 rounded-[1.75rem] border border-indigo-100 bg-indigo-50 p-6 duration-300">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-indigo-900">
              <LinkIcon className="w-4 h-4" />
              {t("inviteCodeTitle")}
            </h3>
            <p className="mb-4 text-sm text-indigo-700">{t("inviteCodeDesc")}</p>
            <div className="flex items-center gap-2 text-start">
              <Input 
                readOnly 
                value={inviteLink}
                dir="ltr"
                className="flex-1 rounded-lg border-indigo-200 bg-white text-sm text-zinc-900 text-start focus:ring-indigo-500"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert(t("copiedText"));
                }}
                className="rounded-lg border-indigo-200 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-50"
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
                        <p className="text-sm text-zinc-500">{patient.email}</p>
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
      </main>
  );
}
