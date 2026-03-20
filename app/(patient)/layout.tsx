import { PatientNavBar } from "@/components/PatientNavBar";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientNavBar>{children}</PatientNavBar>;
}
