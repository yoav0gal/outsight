import { redirect } from "next/navigation";

export default function SignInPage() {
  redirect("/api/auth/sign-in");
}
