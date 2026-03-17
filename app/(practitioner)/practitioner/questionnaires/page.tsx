"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PractitionerQuestionnaires() {
  const templates = useQuery(api.questionnaires.listTemplates);
  const t = useTranslations("PractitionerQuestionnaires");

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950">{t("title")}</h1>
            <p className="text-zinc-600">{t("description")}</p>
          </div>
          <Link href="/practitioner/questionnaires/new">
            <Button 
              size="lg"
              className="rounded-xl font-bold shadow-md shadow-indigo-100 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("createTemplate")}
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!templates ? (
            <div className="space-y-4 col-span-full">
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
          ) : templates.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-zinc-200 rounded-3xl py-20 text-center">
              <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{t("noTemplates")}</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">{t("noTemplatesDesc")}</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card 
                key={template._id}
                className="border-zinc-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all flex flex-col h-full"
              >
                <CardContent className="p-6 flex flex-col items-start gap-4 flex-1">
                  <div className="space-y-1 w-full text-start">
                    <h4 className="font-bold text-zinc-950 text-lg line-clamp-1">{template.title}</h4>
                    <p className="text-sm text-zinc-500 line-clamp-2">{template.description}</p>
                  </div>
                  <div className="mt-auto pt-4 w-full border-t border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-600">
                      {t("questionsCount", { count: template.questions.length })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
  );
}
