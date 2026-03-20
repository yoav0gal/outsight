import {
  normalizeQuestions,
  normalizeTemplateDescription,
  normalizeTemplateTags,
  normalizeTemplateTitle,
  type QuestionType,
  type TemplateEditorValues,
  type TemplateQuestion,
} from "@/lib/templateEditor";

interface RawTemplateUploadInput {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  questions?: unknown;
}

function validateQuestion(question: unknown, templateIndex: number, questionIndex: number): TemplateQuestion {
  if (!question || typeof question !== "object") {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid question object`);
  }

  const candidate = question as Record<string, unknown>;
  const type = candidate.type;
  const allowedTypes: QuestionType[] = [
    "short_text",
    "long_text",
    "multiple_choice",
    "boolean",
    "numeric_scale",
  ];

  if (typeof candidate.id !== "string" || !candidate.id.trim()) {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: missing question id`);
  }
  if (
    typeof type !== "string" ||
    !allowedTypes.some((allowedType) => allowedType === type)
  ) {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid question type`);
  }
  if (typeof candidate.prompt !== "string" || !candidate.prompt.trim()) {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: missing prompt`);
  }
  if (typeof candidate.required !== "boolean") {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid required flag`);
  }
  const questionType = type as QuestionType;
  if (questionType === "multiple_choice") {
    if (!Array.isArray(candidate.options) || candidate.options.length < 2) {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: multiple choice requires at least two options`);
    }
    const options = candidate.options.map((option) => {
      if (typeof option !== "string" || !option.trim()) {
        throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid multiple choice option`);
      }
      return option;
    });

    return {
      id: candidate.id,
      type: questionType,
      prompt: candidate.prompt,
      required: candidate.required,
      options,
    };
  }

  if (questionType === "numeric_scale") {
    if (!candidate.scaleConfig || typeof candidate.scaleConfig !== "object") {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: numeric scale requires scaleConfig`);
    }

    const scaleConfig = candidate.scaleConfig as Record<string, unknown>;
    if (typeof scaleConfig.min !== "number" || typeof scaleConfig.max !== "number") {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid scale range`);
    }
    if (scaleConfig.max <= scaleConfig.min) {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: scale max must be greater than min`);
    }

    return {
      id: candidate.id,
      type: questionType,
      prompt: candidate.prompt,
      required: candidate.required,
      scaleConfig: {
        min: scaleConfig.min,
        max: scaleConfig.max,
        minLabel: typeof scaleConfig.minLabel === "string" ? scaleConfig.minLabel : undefined,
        maxLabel: typeof scaleConfig.maxLabel === "string" ? scaleConfig.maxLabel : undefined,
      },
    };
  }

  return {
    id: candidate.id,
    type: questionType,
    prompt: candidate.prompt,
    required: candidate.required,
  };
}

function validateTemplate(input: RawTemplateUploadInput, index: number, selectedTags: string[]) {
  if (typeof input.title !== "string" || !input.title.trim()) {
    throw new Error(`Template ${index + 1}: missing title`);
  }

  if (input.description !== undefined && typeof input.description !== "string") {
    throw new Error(`Template ${index + 1}: description must be a string`);
  }

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new Error(`Template ${index + 1}: at least one question is required`);
  }

  if (
    input.tags !== undefined &&
    (!Array.isArray(input.tags) || input.tags.some((tag) => typeof tag !== "string"))
  ) {
    throw new Error(`Template ${index + 1}: tags must be an array of strings`);
  }

  return {
    title: normalizeTemplateTitle(input.title),
    description: normalizeTemplateDescription(input.description ?? ""),
    tags: normalizeTemplateTags([...(input.tags as string[] | undefined ?? []), ...selectedTags]),
    questions: normalizeQuestions(
      input.questions.map((question, questionIndex) => validateQuestion(question, index, questionIndex))
    ),
  } satisfies TemplateEditorValues;
}

export function parseTemplateUploadJson(raw: string, selectedTags: string[]) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  if (candidates.length === 0) {
    throw new Error("The JSON file does not contain any templates");
  }

  return candidates.map((candidate, index) =>
    validateTemplate(candidate as RawTemplateUploadInput, index, selectedTags)
  );
}
