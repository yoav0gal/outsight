"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { SyncUser } from "@/components/SyncUser";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Signpost } from "lucide-react";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const t = useTranslations("LandingPage");

  return (
    <div className="flex min-h-screen flex-col font-sans text-zinc-900 relative">
      <WaterRipplesBackground />
      <Suspense fallback={null}>
        <SyncUser />
      </Suspense>

      <header className="flex items-center justify-between px-8 py-8 w-full z-10 transition-opacity">
        <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight text-indigo-600 hover:opacity-80 transition-opacity">
          <Signpost className="w-8 h-8" />
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto z-10 w-full mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-6 mb-12 relative">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-zinc-950 flex flex-col items-center">
            {t("heroTitleLine1")} 
            <span className="text-indigo-600 font-medium italic mt-2 drop-shadow-sm">{t("heroTitleLine2")}</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 max-w-2xl mx-auto leading-relaxed font-medium mt-6">
            {t("heroSubtitle")}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/sign-in" 
            className={cn(
              buttonVariants({ size: "lg" }), 
              "bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold group h-auto py-4 px-10 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            )}
          >
            {t("startForFree")}
            <div className="w-5 h-5 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180 text-white group-hover:text-white">
              <ArrowRight className="w-full h-full stroke-[3]" />
            </div>
          </Link>
        </div>
      </main>

      {/* <footer className="py-6 text-center text-zinc-400 text-sm z-10 font-medium tracking-wide">
        {t("footer")}
      </footer> */}
    </div>
  );
}
