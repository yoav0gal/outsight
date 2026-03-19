import { PractitionerNavBar } from "@/components/PractitionerNavBar";

export default function PractitionerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PractitionerNavBar>{children}</PractitionerNavBar>;
}
