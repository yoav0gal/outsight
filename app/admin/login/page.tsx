import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { redirectIfAdminAuthenticated } from "@/lib/admin/guards";

export default async function AdminLoginPage() {
  await redirectIfAdminAuthenticated();

  return <AdminLoginForm />;
}
