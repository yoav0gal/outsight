"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { UserPlus, Users, Link as LinkIcon, LogOut } from "lucide-react";
import { useState } from "react";

export default function PractitionerDashboard() {
  const { signOut } = useAuth();
  const patients = useQuery(api.users.listPatients);
  const createInvite = useMutation(api.invites.create);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const token = await createInvite({});
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/join?token=${token}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Users className="w-6 h-6" />
          <span>Outsight Practitioner</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950">My Patients</h1>
            <p className="text-zinc-600">Manage and track your patients' progress.</p>
          </div>
          <button 
            onClick={handleGenerateInvite}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5" />
            Add Patient
          </button>
        </div>

        {inviteLink && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Patient Invitation Link Generated
            </h3>
            <p className="text-sm text-indigo-700 mb-4">Send this link to your patient. They can use it to create an account linked to your practice.</p>
            <div className="flex items-center gap-2">
              <input 
                readOnly 
                value={inviteLink}
                className="flex-1 bg-white border border-indigo-200 rounded-lg px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("Copied to clipboard!");
                }}
                className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {!patients ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-500">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl py-20 text-center">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">No patients yet</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">Click "Add Patient" to invite your first patient to the platform.</p>
            </div>
          ) : (
            patients.map((patient) => (
              <div key={patient._id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-500 text-lg uppercase">
                    {patient.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-950">{patient.name || "Unnamed Patient"}</h4>
                    <p className="text-sm text-zinc-500">{patient.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Active</span>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
