"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { SyncUser } from "@/components/SyncUser";
import { Suspense } from "react";
import { ArrowRight, ClipboardCheck, Users, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900">
      <Suspense fallback={null}>
        <SyncUser />
      </Suspense>

      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-indigo-600">
          <ClipboardCheck className="w-8 h-8" />
          <span>Outsight</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">About</a>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-semibold text-zinc-700 hover:text-indigo-600 transition-colors px-4">
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-950 mb-6">
          The Modern Tool for <br />
          <span className="text-indigo-600">CBT Practitioners</span>
        </h1>
        <p className="text-xl text-zinc-600 mb-10 max-w-2xl leading-relaxed">
          Streamline your practice, track patient progress, and manage exercises with ease. Built specifically for the needs of CBT therapy.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link 
            href="/sign-up" 
            className="flex items-center justify-center gap-2 bg-zinc-950 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-zinc-800 transition-all group"
          >
            Start for free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#demo" 
            className="flex items-center justify-center bg-white text-zinc-950 border border-zinc-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-zinc-50 transition-all shadow-sm"
          >
            Book a demo
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full">
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-left">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Patient Management</h3>
            <p className="text-zinc-600">Easily add patients and track their journey through the CBT process.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-left">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Exercise Tracking</h3>
            <p className="text-zinc-600">Assign thought records and behavioral experiments with a click.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Compliant</h3>
            <p className="text-zinc-600">Your patient data is protected with industry-standard encryption.</p>
          </div>
        </div>
      </main>

      <footer className="py-10 border-t border-zinc-200 text-center text-zinc-500 text-sm">
        © 2024 Outsight. All rights reserved.
      </footer>
    </div>
  );
}
