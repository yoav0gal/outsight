import {
  normalizeQuestions,
  normalizeTemplateDescription,
  normalizeTemplateTags,
  normalizeTemplateTitle,
  type QuestionType,
  type TemplateScoring,
  type TemplateEditorValues,
  type TemplateQuestion,
} from "@/lib/templateEditor";

interface RawTemplateUploadInput {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  questions?: unknown;
  scoring?: unknown;
}

function validateScoring(
  scoring: unknown,
  questions: TemplateQuestion[],
  templateIndex: number
): TemplateScoring {
  if (!scoring || typeof scoring !== "object") {
    throw new Error(`Template ${templateIndex + 1}: invalid scoring object`);
  }

  const candidate = scoring as Record<string, unknown>;
  if (candidate.mode !== "standard") {
    throw new Error(`Template ${templateIndex + 1}: only standard scoring is supported`);
  }

  if (
    !Array.isArray(candidate.includedQuestionIds) ||
    candidate.includedQuestionIds.length === 0 ||
    candidate.includedQuestionIds.some((questionId) => typeof questionId !== "string" || !questionId.trim())
  ) {
    throw new Error(
      `Template ${templateIndex + 1}: scoring must include at least one valid question id`
    );
  }

  const validQuestionIds = new Set(questions.map((question) => question.id));
  for (const questionId of candidate.includedQuestionIds as string[]) {
    if (!validQuestionIds.has(questionId)) {
      throw new Error(
        `Template ${templateIndex + 1}: scoring references unknown question id "${questionId}"`
      );
    }
  }

  let answerScores: Record<string, Record<string, number>> | undefined;
  if (candidate.answerScores !== undefined) {
    if (!candidate.answerScores || typeof candidate.answerScores !== "object") {
      throw new Error(`Template ${templateIndex + 1}: scoring answerScores must be an object`);
    }

    answerScores = {};
    for (const [questionId, rawScoreMap] of Object.entries(
      candidate.answerScores as Record<string, unknown>
    )) {
      if (!validQuestionIds.has(questionId)) {
        throw new Error(
          `Template ${templateIndex + 1}: scoring answerScores references unknown question id "${questionId}"`
        );
      }

      if (!rawScoreMap || typeof rawScoreMap !== "object") {
        throw new Error(
          `Template ${templateIndex + 1}: scoring answerScores for "${questionId}" must be an object`
        );
      }

      const normalizedScoreMap: Record<string, number> = {};
      for (const [answerValue, score] of Object.entries(rawScoreMap as Record<string, unknown>)) {
        if (typeof score !== "number" || Number.isNaN(score)) {
          throw new Error(
            `Template ${templateIndex + 1}: scoring answerScores for "${questionId}" must be numeric`
          );
        }

        normalizedScoreMap[answerValue] = score;
      }

      answerScores[questionId] = normalizedScoreMap;
    }
  }

  return {
    mode: "standard",
    includedQuestionIds: candidate.includedQuestionIds as string[],
    answerScores,
  };
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
    "cards",
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
  if (questionType === "multiple_choice" || questionType === "cards") {
    if (!Array.isArray(candidate.options) || candidate.options.length < 2) {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: choice questions require at least two options`);
    }
    const options = candidate.options.map((option) => {
      if (typeof option !== "string" || !option.trim()) {
        throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid choice option`);
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

  const questions = normalizeQuestions(
    input.questions.map((question, questionIndex) => validateQuestion(question, index, questionIndex))
  );

  return {
    title: normalizeTemplateTitle(input.title),
    description: normalizeTemplateDescription(input.description ?? ""),
    tags: normalizeTemplateTags([...(input.tags as string[] | undefined ?? []), ...selectedTags]),
    questions,
    scoring: input.scoring === undefined ? undefined : validateScoring(input.scoring, questions, index),
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
