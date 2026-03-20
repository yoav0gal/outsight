import { redirect } from "next/navigation";

import { hasValidAdminSession } from "@/lib/admin/session";

export async function requireAdminSession() {
  const isAuthenticated = await hasValidAdminSession();
  if (!isAuthenticated) {
    redirect("/admin/login");
  }
}

export async function redirectIfAdminAuthenticated() {
  const isAuthenticated = await hasValidAdminSession();
  if (isAuthenticated) {
    redirect("/admin/templates");
  }
}
