"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { code?: string };
        setError(
          body.code === "invalid_password" ? t("login.invalidPassword") : t("shared.genericError")
        );
        return;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch {
      setError(t("shared.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-6 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_calc(100%-1px),rgba(99,102,241,0.06)_100%)] bg-[size:36px_36px] opacity-60" />
      <Card className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 py-0 shadow-[0_30px_80px_-40px_rgba(79,70,229,0.45)] backdrop-blur">
        <CardContent className="space-y-8 px-8 py-8">
          <div className="space-y-4 text-start">
            <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-indigo-100 text-indigo-700 shadow-inner shadow-white">
              <ShieldCheck className="size-7" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">
                {t("login.eyebrow")}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                {t("login.title")}
              </h1>
              <p className="text-sm leading-6 text-zinc-600">{t("login.description")}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.passwordLabel")}</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl border-zinc-200 bg-white/90 ps-10"
                  placeholder={t("login.passwordPlaceholder")}
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
