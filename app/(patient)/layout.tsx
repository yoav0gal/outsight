import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { PatientNavBar } from "@/components/PatientNavBar";
import { getViewerFromAccessToken } from "@/lib/convex/server";
import { getPatientSessionFromCookie, createPatientAccessToken } from "@/lib/patientAuth/server";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const patientSession = await getPatientSessionFromCookie();

  if (patientSession) {
    return <PatientNavBar>{children}</PatientNavBar>;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_LOGIN === "false") {
    const cookieStore = await cookies();
    const devUserTokenIdentifier = cookieStore.get("outsight_dev_user_token_identifier")?.value;
    if (devUserTokenIdentifier) {
      const mockToken = await createPatientAccessToken(devUserTokenIdentifier);
      const viewer = await getViewerFromAccessToken(mockToken);
      if (viewer && viewer.role === "patient") {
        return <PatientNavBar>{children}</PatientNavBar>;
      }
      if (viewer && viewer.role === "practitioner") {
        redirect("/practitioner/my-patients");
      }
    }
    redirect("/");
  }

  let workosSession = null;
  try {
    workosSession = await withAuth();
  } catch {
    // Route not covered by AuthKit middleware (e.g. bypassed patient routes)
  }

  if (!workosSession || !workosSession.user || !workosSession.accessToken) {
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
