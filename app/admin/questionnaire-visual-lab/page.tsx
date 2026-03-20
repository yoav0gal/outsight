import { readFile } from "node:fs/promises";
import path from "node:path";

import { QuestionnaireVisualizationLab } from "@/components/admin/QuestionnaireVisualizationLab";
import twoInOneTemplates from "@/generated/admin-imports/2in1.system-templates.json";
import { requireAdminSession } from "@/lib/admin/guards";

export default async function QuestionnaireVisualLabPage() {
  await requireAdminSession();

  const socialAnxietyTemplatePath = path.join(
    process.cwd(),
    "generated/admin-imports/social-anxiety.system-template.json"
  );

  let template = twoInOneTemplates[0];

  try {
    template = JSON.parse(await readFile(socialAnxietyTemplatePath, "utf8")) as typeof template;
  } catch {
    template = twoInOneTemplates[0];
  }

  return (
    <QuestionnaireVisualizationLab
      template={template}
      backHref="/admin/templates"
    />
  );
}
