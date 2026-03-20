import { PatientNavBar } from "@/components/PatientNavBar";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <PatientNavBar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
