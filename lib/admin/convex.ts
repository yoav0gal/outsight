type ConvexFunctionType = "query" | "mutation";

interface ConvexSuccessResponse<T> {
  status: "success";
  value: T;
}

interface ConvexErrorResponse {
  status: "error";
  errorMessage: string;
}

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  return url;
}

function getAdminApiSecret() {
  const secret = process.env.ADMIN_DASHBOARD_API_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_DASHBOARD_API_SECRET");
  }

  return secret;
}

async function callConvexFunction<T>(
  type: ConvexFunctionType,
  path: string,
  args: Record<string, unknown>
) {
  const response = await fetch(`${getConvexUrl()}/api/${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      path,
      args: {
        adminSecret: getAdminApiSecret(),
        ...args,
      },
      format: "json",
    }),
  });

  const data = (await response.json()) as ConvexSuccessResponse<T> | ConvexErrorResponse;

  if (!response.ok || data.status === "error") {
    throw new Error(
      "errorMessage" in data ? data.errorMessage : "Failed to call Convex admin function"
    );
  }

  return data.value;
}

export function listSystemTemplatesAdmin() {
  return callConvexFunction<
    Array<{
      _id: string;
      title: string;
      description?: string;
      tags: string[];
      source: "system";
      archivedAt?: number;
      scoring?: TemplateScoring;
      questions: TemplateQuestion[];
    }>
  >("query", "adminTemplates:listSystemTemplatesAdmin", {});
}

export function listAllTemplateTagsAdmin() {
  return callConvexFunction<string[]>("query", "adminTemplates:listAllTemplateTagsAdmin", {});
}

export function getSystemTemplateAdmin(templateId: string) {
  return callConvexFunction<{
    _id: string;
    title: string;
    description?: string;
    tags: string[];
    source: "system";
    archivedAt?: number;
    scoring?: TemplateScoring;
    questions: TemplateQuestion[];
  }>("query", "adminTemplates:getSystemTemplateAdmin", { templateId });
}

export function createSystemTemplatesAdmin(
  templates: Array<{
    title: string;
    description?: string;
    tags?: string[];
    scoring?: TemplateScoring;
    questions: unknown[];
  }>
) {
  return callConvexFunction<string[]>("mutation", "adminTemplates:createSystemTemplatesAdmin", {
    templates,
  });
}

export function updateSystemTemplateAdmin(
  templateId: string,
  values: {
    title: string;
    description?: string;
    tags?: string[];
    scoring?: TemplateScoring;
    questions: unknown[];
  }
) {
  return callConvexFunction<string>("mutation", "adminTemplates:updateSystemTemplateAdmin", {
    templateId,
    ...values,
  });
}

export function archiveSystemTemplateAdmin(templateId: string) {
  return callConvexFunction<null>("mutation", "adminTemplates:archiveSystemTemplateAdmin", {
    templateId,
  });
}

export function unarchiveSystemTemplateAdmin(templateId: string) {
  return callConvexFunction<null>("mutation", "adminTemplates:unarchiveSystemTemplateAdmin", {
    templateId,
  });
}

export function deleteSystemTemplateAdmin(templateId: string) {
  return callConvexFunction<null>("mutation", "adminTemplates:deleteSystemTemplateAdmin", {
    templateId,
  });
}
import type { TemplateQuestion, TemplateScoring } from "@/lib/templateEditor";
