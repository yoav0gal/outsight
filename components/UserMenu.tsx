"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLanguage } from "@/app/actions/language";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages } from "lucide-react";

export function UserMenu() {
  const user = useQuery(api.users.viewer);
  const { signOut } = useAuth();
  const t = useTranslations("UserMenu");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: "en" | "he") => {
    if (locale === nextLocale) return;
    startTransition(() => {
      setLanguage(nextLocale);
    });
  };

  const handleSignOut = async () => {
    await fetch("/api/patient-auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (user?.authType === "patient_credentials") {
      router.push("/anonymous/sign-in");
      router.refresh();
      return;
    }

    const returnTo = typeof window !== "undefined" ? window.location.origin : undefined;
    signOut(returnTo ? { returnTo } : undefined);
  };

  if (user === undefined) {
    return <Skeleton className="w-32 h-10 rounded-full" />;
  }

  if (!user) return null;

  const primaryLabel =
    user.role === "patient"
      ? user.accountName ?? user.loginIdentifier ?? user.name ?? t("anonymousPatient")
      : user.name ?? user.email ?? t("anonymousPatient");

  const initials = primaryLabel
    ? primaryLabel
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.loginIdentifier ?? user.email ?? "P").charAt(0).toUpperCase();

  const secondaryLabel = user.email ?? user.loginIdentifier ?? t("anonymousPatient");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-zinc-50 p-1.5 pe-3 rounded-full transition-colors outline-none group border border-transparent hover:border-zinc-200">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-indigo-200 transition-colors">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-none gap-1">
          <span className="text-sm font-bold text-zinc-900 line-clamp-1">{primaryLabel}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 mt-2 rounded-xl p-2 shadow-xl border-zinc-200">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-950">{primaryLabel}</p>
                {user.role === "practitioner" && (
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wide">
                    {t("practitioner")}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium">{secondaryLabel}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-2 bg-zinc-100" />
        
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isPending} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-zinc-50">
              <Languages className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700 flex-1 text-start">
                {t("displayLanguage")}: <span className="font-bold text-indigo-600">{t(`languages.${locale}`)}</span>
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="rounded-xl p-1 shadow-lg">
              <DropdownMenuItem 
                onClick={() => handleLanguageChange("en")}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer"
              >
                <span>{t("languages.en")}</span>
                {locale === "en" && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLanguageChange("he")}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer"
              >
                <span>{t("languages.he")}</span>
                {locale === "he" && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2 bg-zinc-100" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 rtl:rotate-180" />
          <span className="font-bold">{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
