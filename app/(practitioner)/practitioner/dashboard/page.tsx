"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { UserPlus, Users, Link as LinkIcon, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PractitionerDashboard() {
  const { signOut } = useAuth();
  const patients = useQuery(api.users.listPatients);
  const createInvite = useMutation(api.invites.create);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("PractitionerDashboard");

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
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Users className="w-6 h-6" />
          <span>{t("title")}</span>
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <Button 
            variant="ghost"
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 rtl:rotate-180" />
            {t("signOut")}
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950">{t("myPatients")}</h1>
            <p className="text-zinc-600">{t("myPatientsDesc")}</p>
          </div>
          <Button 
            onClick={handleGenerateInvite}
            disabled={loading}
            size="lg"
            className="rounded-xl font-bold shadow-md shadow-indigo-100 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t("addPatient")}
          </Button>
        </div>

        {inviteLink && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              {t("inviteLinkGenerated")}
            </h3>
            <p className="text-sm text-indigo-700 mb-4">{t("inviteLinkDesc")}</p>
            <div className="flex items-center gap-2 text-start">
              <Input 
                readOnly 
                value={inviteLink}
                dir="ltr"
                className="flex-1 bg-white border-indigo-200 rounded-lg text-sm text-zinc-900 focus:ring-indigo-500 text-start"
              />
              <Button 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert(t("copiedText"));
                }}
                className="border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all"
              >
                {t("copy")}
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {!patients ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-zinc-100 shadow-sm">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 w-full">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl py-20 text-center">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{t("noPatients")}</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">{t("noPatientsDesc")}</p>
            </div>
          ) : (
            patients.map((patient) => (
              <Link key={patient._id} href={`/practitioner/patient/${patient._id}`}>
                <Card 
                  className="border-zinc-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <CardContent className="p-6 flex items-center justify-between text-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-500 text-lg uppercase">
                        {patient.name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-950">{patient.name || t("unnamedPatient")}</h4>
                        <p className="text-sm text-zinc-500">{patient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">{t("activeStatus")}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-300 rtl:rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
