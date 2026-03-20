import { redirect } from "next/navigation";

import { hasValidAdminSession } from "@/lib/admin/session";

export default async function AdminPage() {
  if (await hasValidAdminSession()) {
    redirect("/admin/templates");
  }

  redirect("/admin/login");
}
