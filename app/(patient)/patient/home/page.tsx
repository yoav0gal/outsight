"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { LogOut, Heart, Smile } from "lucide-react";

export default function PatientHome() {
  const { signOut } = useAuth();
  const user = useQuery(api.users.viewer);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Heart className="w-6 h-6" />
          <span>Outsight Patient</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-8">
          <Smile className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-zinc-950 mb-4">
          Hi {user?.name || "there"}! You're in.
        </h1>
        
        <p className="text-xl text-zinc-600 mb-12 max-w-md">
          Welcome to Outsight. Your practitioner has added you to their practice. This is where you'll see your progress and exercises soon.
        </p>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm w-full">
          <h3 className="font-bold text-zinc-900 mb-2">Getting Started</h3>
          <p className="text-zinc-500 mb-6 italic">"The journey of a thousand miles begins with a single step."</p>
          <div className="grid gap-4 text-left">
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p className="text-sm text-zinc-700 font-medium">Wait for your therapist to assign your first exercise.</p>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-2xl bg-zinc-50 border border-zinc-100 opacity-50">
              <div className="w-6 h-6 bg-zinc-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p className="text-sm text-zinc-700 font-medium">Complete your thought records regularly.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
