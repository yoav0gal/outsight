"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ArrowLeft, Signpost } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AnonymousSignInPage() {
  const router = useRouter();
  const t = useTranslations("PatientAuth");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/patient-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { code?: string };
        setError(
          body.code === "invalid_credentials" ? t("signIn.errors.invalidCredentials") : t("signIn.errors.generic"),
        );
        return;
      }

      router.push("/patient/home");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(t("signIn.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_32%),linear-gradient(180deg,_#fafbff_0%,_#f3f6fb_100%)] px-6 py-8">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_transparent_46%)]" />
      <div className="absolute start-[-7rem] top-28 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute end-[-6rem] bottom-10 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col justify-center">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 rounded-full border border-zinc-200/80 bg-white/85 px-3 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur hover:bg-white hover:text-zinc-950"
            )}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{t("signIn.backHome")}</span>
          </Link>

          <div className="flex items-center gap-3 text-zinc-900">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/80">
              <Signpost className="size-5 text-indigo-600" />
            </div>
            <span className="text-lg font-semibold tracking-tight">{t("signIn.brand")}</span>
          </div>
        </div>

        <div className="space-y-5 rounded-[1.75rem] bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-zinc-200/70 backdrop-blur">
          <h1 className="text-2xl font-black tracking-tight text-zinc-950">{t("signIn.title")}</h1>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-zinc-800">
                {t("signIn.usernameLabel")}
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t("signIn.usernamePlaceholder")}
                autoCapitalize="none"
                autoCorrect="off"
                className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/70 px-4 shadow-none focus-visible:bg-white focus-visible:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-zinc-800">
                {t("signIn.passwordLabel")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("signIn.passwordPlaceholder")}
                className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/70 px-4 shadow-none focus-visible:bg-white focus-visible:ring-indigo-500"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-[0_16px_32px_rgba(79,70,229,0.22)] hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("signIn.submitting") : t("signIn.submit")}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
