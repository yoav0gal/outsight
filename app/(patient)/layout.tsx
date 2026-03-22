import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { PatientNavBar } from "@/components/PatientNavBar";
import { getViewerFromAccessToken } from "@/lib/convex/server";
import { getPatientSessionFromCookie } from "@/lib/patientAuth/server";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const patientSession = await getPatientSessionFromCookie();

  if (patientSession) {
    return <PatientNavBar>{children}</PatientNavBar>;
  }

  const workosSession = await withAuth();
  if (!workosSession.user || !workosSession.accessToken) {
    redirect("/anonymous/sign-in");
  }

  const viewer = await getViewerFromAccessToken(workosSession.accessToken);
  if (!viewer) {
    redirect("/anonymous/sign-in");
  }

  if (viewer.role !== "patient") {
    redirect("/practitioner/my-patients");
  }

  return <PatientNavBar>{children}</PatientNavBar>;
}
