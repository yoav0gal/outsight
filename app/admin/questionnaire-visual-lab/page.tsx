import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  QuestionnaireVisualizationLab,
  type QuestionnaireTemplate,
} from "@/components/admin/QuestionnaireVisualizationLab";
import twoInOneTemplates from "@/generated/admin-imports/2in1.system-templates.json";
import { requireAdminSession } from "@/lib/admin/guards";

export default async function QuestionnaireVisualLabPage() {
  await requireAdminSession();

  const socialAnxietyTemplatePath = path.join(
    process.cwd(),
    "generated/admin-imports/social-anxiety.system-template.json"
  );

  let template = twoInOneTemplates[0] as unknown as QuestionnaireTemplate;

  try {
    template = JSON.parse(await readFile(socialAnxietyTemplatePath, "utf8")) as QuestionnaireTemplate;
  } catch {
    template = twoInOneTemplates[0] as unknown as QuestionnaireTemplate;
  }

  return (
    <QuestionnaireVisualizationLab
      template={template}
      backHref="/admin/templates"
    />
  );
}
