"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users, FileText, Sprout } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

interface PractitionerNavBarProps {
  children: ReactNode;
}

export function PractitionerNavBar({ children }: PractitionerNavBarProps) {
  const t = useTranslations("PractitionerNavBar");
  const pathname = usePathname();

  const isMyPatientsActive = pathname === "/practitioner/my-patients" || pathname.startsWith("/practitioner/patient/");
  const isQuestionnairesActive = pathname.startsWith("/practitioner/questionnaires");

  const navItems = [
    { 
      href: "/practitioner/my-patients", 
      label: t("myPatients"), 
      icon: Users,
      isActive: isMyPatientsActive
    },
    { 
      href: "/practitioner/questionnaires", 
      label: t("questionnaires"), 
      icon: FileText,
      isActive: isQuestionnairesActive
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <Link href="/practitioner/my-patients" className="flex items-center gap-2 font-black text-2xl text-indigo-600 tracking-tight">
            <Sprout className="size-7 text-indigo-600" strokeWidth={2.2} />
            <span className="hidden xs:inline">{t("title")}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                  item.isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Bottom Navigation - Mobile Primary */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 px-6 py-3 pb-safe-offset-3 z-30 flex items-center justify-around md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${
                item.isActive ? "text-indigo-600 scale-110" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${item.isActive ? "bg-indigo-50" : ""}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
