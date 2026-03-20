import { AdminTemplatesDashboard } from "@/components/admin/AdminTemplatesDashboard";
import { requireAdminSession } from "@/lib/admin/guards";
import { listAllTemplateTagsAdmin, listSystemTemplatesAdmin } from "@/lib/admin/convex";

export default async function AdminTemplatesPage() {
  await requireAdminSession();

  const [templates, availableTags] = await Promise.all([
    listSystemTemplatesAdmin(),
    listAllTemplateTagsAdmin(),
  ]);

  return <AdminTemplatesDashboard templates={templates} availableTags={availableTags} />;
}
