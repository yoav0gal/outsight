"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import Link from "next/link";
import { SyncUser } from "@/components/SyncUser";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OutsightMark } from "@/components/brand/OutsightMark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

const WaterRipplesBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        @keyframes DropRipple {
          0% {
            transform: scale(0.01);
            opacity: 0.7;
            border-width: 4px;
          }
          15% {
            opacity: 0.5;
            border-width: 2px;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
            border-width: 1px;
          }
        }
        @keyframes BlobFloat {
          0%, 100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
        }
        .water-ring {
          position: absolute;
          border-radius: 50%;
          border-style: solid;
          animation: DropRipple 8s cubic-bezier(0.1, 0.7, 0.3, 1) infinite;
        }
        .water-blob {
          position: absolute;
          animation: BlobFloat 20s ease-in-out infinite alternate;
        }
      `}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-zinc-50/50">
        
        {/* Soft, fluid base underwater gradient blobs */}
        <div 
          className="water-blob fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] opacity-10 blur-[120px] bg-gradient-to-tr from-sky-400 to-indigo-500 transition-transform duration-1000 ease-out"
          style={{ transform: `translate(calc(-50% + ${mousePosition.x * 0.03}px), calc(-50% + ${mousePosition.y * 0.03}px))` }}
        />
        <div 
          className="water-blob fixed top-1/2 left-1/4 -translate-y-1/2 w-[80vw] h-[100vw] opacity-[0.05] blur-[150px] bg-teal-400"
          style={{ animationDelay: '-5s', transform: `translate(calc(-50% + ${mousePosition.x * -0.01}px), calc(-50% + ${mousePosition.y * 0.02}px))` }}
        />

        {/* Raindrop 1: Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] border-indigo-300">
          <div className="water-ring inset-0 text-indigo-400" style={{ animationDelay: "0s", borderColor: "currentColor" }} />
          <div className="water-ring inset-0 text-indigo-400" style={{ animationDelay: "0.4s", borderColor: "currentColor" }} />
          <div className="water-ring inset-0 text-indigo-400" style={{ animationDelay: "0.8s", borderColor: "currentColor" }} />
        </div>

        {/* Raindrop 2: Top Right */}
        <div className="absolute top-[20%] right-[20%] w-[60vmin] h-[60vmin] border-sky-300">
          <div className="water-ring inset-0 text-sky-400/80" style={{ animationDelay: "3s", borderColor: "currentColor" }} />
          <div className="water-ring inset-0 text-sky-400/80" style={{ animationDelay: "3.5s", borderColor: "currentColor" }} />
        </div>

        {/* Raindrop 3: Bottom Left, delayed and slower visually by size trick */}
        <div className="absolute bottom-[10%] left-[10%] w-[100vmin] h-[100vmin]">
          <div className="water-ring inset-0 text-indigo-500/50" style={{ animationDelay: "5.5s", borderColor: "currentColor" }} />
          <div className="water-ring inset-0 text-indigo-500/50" style={{ animationDelay: "6.2s", borderColor: "currentColor" }} />
          <div className="water-ring inset-0 text-indigo-500/50" style={{ animationDelay: "6.9s", borderColor: "currentColor" }} />
        </div>

      </div>
    </>
  );
};

export default function LandingPage() {
  const { user } = useAuth();
  const viewer = useQuery(api.users.viewer);
  const router = useRouter();
  const t = useTranslations("LandingPage");

  useEffect(() => {
    if (user || !viewer) {
      return;
    }

    if (viewer.role === "practitioner") {
      router.replace("/practitioner/my-patients");
      return;
    }

    router.replace("/patient/home");
  }, [user, viewer, router]);

  return (
    <div className="flex min-h-screen flex-col font-sans text-zinc-900 relative">
      <WaterRipplesBackground />
      <Suspense fallback={null}>
        <SyncUser />
      </Suspense>

      <header className="flex items-center justify-between px-8 py-8 w-full z-10 transition-opacity">
        <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight text-indigo-600 hover:opacity-80 transition-opacity">
          <OutsightMark className="size-8" />
          <span>{t("title")}</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <LanguageSwitcher />
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="relative mb-8 space-y-3">
          <h1 className="flex flex-col items-center text-5xl font-black tracking-tight text-zinc-950 md:text-7xl">
            {t("heroTitleLine1")} 
            <span className="mt-2 font-medium italic text-indigo-600 drop-shadow-sm">{t("heroTitleLine2")}</span>
          </h1>
        </div>

        <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
          <Link
            href="/api/auth/sign-in"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)] transition-transform duration-200 hover:bg-indigo-700 hover:-translate-y-0.5"
            )}
          >
            {t("quickLoginTitle")}
          </Link>

          <Link
            href="/anonymous/sign-in"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 rounded-full border-zinc-200 bg-white/90 px-5 text-sm font-semibold text-zinc-800 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white"
            )}
          >
            {t("anonymousLoginTitle")}
          </Link>
        </div>
      </main>

      {/* <footer className="py-6 text-center text-zinc-400 text-sm z-10 font-medium tracking-wide">
        {t("footer")}
      </footer> */}
    </div>
  );
}
