import { AdminToolsDashboard } from "@/components/admin/AdminToolsDashboard";
import { requireAdminSession } from "@/lib/admin/guards";
import { listToolsAdmin } from "@/lib/admin/convex";

export default async function AdminToolsPage() {
  await requireAdminSession();

  const tools = await listToolsAdmin();

  return <AdminToolsDashboard initialTools={tools} />;
}
