"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const t = useTranslations("Admin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isSubmitting} className="rounded-xl border-zinc-200">
      <LogOut className="size-4 rtl:rotate-180" />
      {t("dashboard.logout")}
    </Button>
  );
}
