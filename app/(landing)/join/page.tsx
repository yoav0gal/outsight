"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PATIENT_PASSWORD_MIN_LENGTH } from "@/lib/patientAuth/password";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("PatientAuth");
  const token = searchParams.get("token");
  const { user, loading: authLoading } = useAuth();
  const [isRedirectingAfterSubmit, setIsRedirectingAfterSubmit] = useState(false);
  const invite = useQuery(
    api.invites.getRegistrationInvite,
    token && !isRedirectingAfterSubmit ? { token } : "skip",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkOnlyError, setLinkOnlyError] = useState<string | null>(null);

  const inviteState = useMemo(() => {
    if (!token) {
      return "missing";
    }

    if (invite === undefined) {
      return "loading";
    }

    if (!invite) {
      return "invalid";
    }

    return "ready";
  }, [invite, token]);

  useEffect(() => {
    if (inviteState === "ready" && invite?.mode === "link_only" && token) {
      let isMounted = true;
      const autoLogin = async () => {
        try {
          const response = await fetch("/api/patient-auth/link-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });

          if (!isMounted) return;

          if (response.ok) {
            const redirectTo = searchParams.get("redirectTo") || "/patient/home";
            window.location.assign(redirectTo);
          } else {
            setLinkOnlyError(t("register.errors.generic"));
          }
        } catch (err) {
          console.error(err);
          if (isMounted) {
            setLinkOnlyError(t("register.errors.generic"));
          }
        }
      };

      autoLogin();

      return () => {
        isMounted = false;
      };
    }
  }, [inviteState, invite?.mode, token, t, searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError(t("register.errors.invalidInvite"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("register.errors.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/patient-auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          username,
          password,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { code?: string };
        const code = body.code ?? "registration_failed";
        setError(
          code === "username_taken"
            ? t("register.errors.usernameTaken")
            : code === "invalid_username"
              ? t("register.errors.invalidUsername")
              : code === "invalid_password"
                ? t("register.errors.invalidPassword", { min: PATIENT_PASSWORD_MIN_LENGTH })
                : code === "invalid_invite"
                  ? t("register.errors.invalidInvite")
                  : t("register.errors.generic"),
        );
        return;
      }

      setIsRedirectingAfterSubmit(true);
      const redirectTo = searchParams.get("redirectTo") || "/patient/home";
      window.location.assign(redirectTo);
    } catch (submitError) {
      console.error(submitError);
      setError(t("register.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRedirectingAfterSubmit) {
    return <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />;
  }

  if (inviteState === "loading") {
    return <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />;
  }

  if (inviteState !== "ready") {
    return (
      <Card className="w-full max-w-lg rounded-[2rem] border-zinc-200 shadow-xl shadow-zinc-200/40">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-2xl font-black text-zinc-950">{t("register.invalidInviteTitle")}</CardTitle>
          <CardDescription className="text-base text-zinc-600">{t("register.errors.invalidInvite")}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/anonymous/sign-in" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            {t("register.backToSignIn")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const resolvedInvite = invite!;

  if (resolvedInvite.mode === "link_only") {
    return (
      <Card className="w-full max-w-lg rounded-[2rem] border-zinc-200 shadow-xl shadow-zinc-200/40">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-2xl font-black text-zinc-950">
            {linkOnlyError ? t("register.errors.generic") : "Connecting..."}
          </CardTitle>
          <CardDescription className="text-base text-zinc-600">
            {linkOnlyError 
              ? linkOnlyError 
              : "Verifying your link and preparing your questionnaire. Please wait..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          {!linkOnlyError ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          ) : (
            <Link href="/anonymous/sign-in" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              {t("register.backToSignIn")}
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  if (resolvedInvite.mode === "workos") {
    const handleContinue = () => {
      if (!token) {
        setError(t("register.errors.invalidInvite"));
        return;
      }

      document.cookie = `invitation_token=${token}; max-age=3600; path=/; sameSite=lax`;

      if (user) {
        router.push("/");
        return;
      }

      router.push("/api/auth/sign-up");
    };

    return (
      <Card className="w-full max-w-lg rounded-[2rem] border-zinc-200 shadow-xl shadow-zinc-200/40">
        <CardHeader className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{t("workosInvite.eyebrow")}</p>
          <CardTitle className="text-3xl font-black text-zinc-950">{t("workosInvite.title")}</CardTitle>
          <CardDescription className="text-base leading-7 text-zinc-600">
            {resolvedInvite.patientName
              ? t("workosInvite.descriptionWithName", { name: resolvedInvite.patientName })
              : t("workosInvite.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="patient-name">{t("register.patientNameLabel")}</Label>
            <Input id="patient-name" readOnly value={resolvedInvite.patientName ?? t("register.unnamedPatient")} />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <Button
            type="button"
            className="h-12 w-full rounded-2xl font-bold"
            disabled={authLoading}
            onClick={handleContinue}
          >
            {user ? t("workosInvite.continueSignedIn") : t("workosInvite.continue")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg rounded-[2rem] border-zinc-200 shadow-xl shadow-zinc-200/40">
      <CardHeader className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{t("register.eyebrow")}</p>
        <CardTitle className="text-3xl font-black text-zinc-950">{t("register.title")}</CardTitle>
        <CardDescription className="text-base leading-7 text-zinc-600">
          {resolvedInvite.patientName
            ? t("register.descriptionWithName", { name: resolvedInvite.patientName })
            : t("register.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="patient-name">{t("register.patientNameLabel")}</Label>
            <Input id="patient-name" readOnly value={resolvedInvite.patientName ?? t("register.unnamedPatient")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t("register.usernameLabel")}</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t("register.usernamePlaceholder")}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("register.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("register.passwordPlaceholder")}
              required
              minLength={PATIENT_PASSWORD_MIN_LENGTH}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("register.confirmPasswordLabel")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("register.confirmPasswordPlaceholder")}
              required
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <Button type="submit" className="h-12 w-full rounded-2xl font-bold" disabled={isSubmitting}>
            {isSubmitting ? t("register.submitting") : t("register.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-12">
      <Suspense fallback={<div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />}>
        <JoinContent />
      </Suspense>
    </main>
  );
}
