import { PractitionerNavBar } from "@/components/PractitionerNavBar";

export default function PractitionerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <PractitionerNavBar />
      {children}
    </div>
  );
}
