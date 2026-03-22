import { redirect } from "next/navigation";

export default function PatientSignInRedirectPage() {
  redirect("/anonymous/sign-in");
}
