"use client";

import Link from "next/link";
import { Signpost, ClipboardList, History } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export function PatientNavBar() {
  const t = useTranslations("PatientNavBar");
  const pathname = usePathname();

  const navItems = [
    { href: "/patient/home", label: t("home"), icon: ClipboardList },
    { href: "/patient/history", label: t("history"), icon: History },
  ];

  return (
    <>
      {/* Top Bar - Brand & Profile */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <Link href="/patient/home" className="flex items-center gap-2 font-black text-2xl text-indigo-600 tracking-tight">
            <Signpost className="w-7 h-7" />
            <span className="hidden xs:inline">{t("title")}</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      {/* Bottom Navigation - Mobile Primary */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 px-6 py-3 pb-safe-offset-3 z-30 flex items-center justify-around md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? "text-indigo-600 scale-110" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? "bg-indigo-50" : ""}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
