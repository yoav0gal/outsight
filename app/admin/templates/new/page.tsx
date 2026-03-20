import { AdminTemplateCreatePage } from "@/components/admin/AdminTemplateCreatePage";
import { listAllTemplateTagsAdmin } from "@/lib/admin/convex";
import { requireAdminSession } from "@/lib/admin/guards";

export default async function AdminTemplateNewPage() {
  await requireAdminSession();

  const availableTags = await listAllTemplateTagsAdmin();

  return <AdminTemplateCreatePage availableTags={availableTags} />;
}
