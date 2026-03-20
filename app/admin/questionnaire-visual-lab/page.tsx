import socialAnxietyTemplate from "@/generated/admin-imports/social-anxiety.system-template.json";

import { QuestionnaireVisualizationLab } from "@/components/admin/QuestionnaireVisualizationLab";
import { requireAdminSession } from "@/lib/admin/guards";

export default async function QuestionnaireVisualLabPage() {
  await requireAdminSession();

  return (
    <QuestionnaireVisualizationLab
      template={socialAnxietyTemplate}
      backHref="/admin/templates"
    />
  );
}
