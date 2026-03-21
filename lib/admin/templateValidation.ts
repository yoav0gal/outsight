import {
  normalizeQuestions,
  normalizeLocalizedText,
  normalizeTemplateDescription,
  normalizeTemplateTags,
  normalizeTemplateTitle,
  resolveFallbackText,
  type LocalizedText,
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

function parseLocalizedTag(
  value: unknown,
  templateIndex: number,
  tagIndex: number
): { fallback: string; translations?: LocalizedText } {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`Template ${templateIndex + 1}: invalid tag at index ${tagIndex + 1}`);
    }

    return { fallback: trimmed };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Template ${templateIndex + 1}: invalid tag at index ${tagIndex + 1}`);
  }

  const translations = normalizeLocalizedText(value as LocalizedText);
  if (!translations) {
    throw new Error(`Template ${templateIndex + 1}: invalid tag at index ${tagIndex + 1}`);
  }

  return {
    fallback: resolveFallbackText(undefined, translations),
    translations,
  };
}

function parseLocalizedText(
  value: unknown,
  templateIndex: number,
  questionIndex: number,
  field: string
): { fallback: string; translations?: LocalizedText } {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: missing ${field}`);
    }

    return { fallback: trimmed };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid ${field}`
    );
  }

  const translations = normalizeLocalizedText(value as LocalizedText);
  if (!translations) {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: missing ${field}`);
  }

  return {
    fallback: resolveFallbackText(undefined, translations),
    translations,
  };
}

function parseOptionalLocalizedText(
  value: unknown,
  templateIndex: number,
  questionIndex: number,
  field: string
) {
  if (value === undefined) {
    return {
      fallback: undefined,
      translations: undefined,
    };
  }

  const parsed = parseLocalizedText(value, templateIndex, questionIndex, field);
  return {
    fallback: parsed.fallback,
    translations: parsed.translations,
  };
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
  const prompt = parseLocalizedText(candidate.prompt, templateIndex, questionIndex, "prompt");
  if (typeof candidate.required !== "boolean") {
    throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: invalid required flag`);
  }
  const questionType = type as QuestionType;
  if (questionType === "multiple_choice" || questionType === "cards") {
    if (!Array.isArray(candidate.options) || candidate.options.length < 2) {
      throw new Error(`Template ${templateIndex + 1}, question ${questionIndex + 1}: choice questions require at least two options`);
    }
    const parsedOptions = candidate.options.map((option) => {
      return parseLocalizedText(
        option,
        templateIndex,
        questionIndex,
        "choice option"
      );
    });

    return {
      id: candidate.id,
      type: questionType,
      prompt: prompt.fallback,
      promptTranslations: prompt.translations,
      required: candidate.required,
      options: parsedOptions.map((option) => option.fallback),
      optionTranslations: parsedOptions.map((option) => option.translations ?? {}),
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

    const minLabel = parseOptionalLocalizedText(
      scaleConfig.minLabel,
      templateIndex,
      questionIndex,
      "scale minLabel"
    );
    const maxLabel = parseOptionalLocalizedText(
      scaleConfig.maxLabel,
      templateIndex,
      questionIndex,
      "scale maxLabel"
    );

    return {
      id: candidate.id,
      type: questionType,
      prompt: prompt.fallback,
      promptTranslations: prompt.translations,
      required: candidate.required,
      scaleConfig: {
        min: scaleConfig.min,
        max: scaleConfig.max,
        minLabel: minLabel.fallback,
        maxLabel: maxLabel.fallback,
        minLabelTranslations: minLabel.translations,
        maxLabelTranslations: maxLabel.translations,
      },
    };
  }

  return {
    id: candidate.id,
    type: questionType,
    prompt: prompt.fallback,
    promptTranslations: prompt.translations,
    required: candidate.required,
  };
}

function validateTemplate(input: RawTemplateUploadInput, index: number, selectedTags: string[]) {
  const title = parseLocalizedText(input.title, index, 0, "title");
  const description =
    input.description === undefined
      ? { fallback: "", translations: undefined }
      : parseLocalizedText(input.description, index, 0, "description");

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new Error(`Template ${index + 1}: at least one question is required`);
  }

  if (
    input.tags !== undefined &&
    !Array.isArray(input.tags)
  ) {
    throw new Error(`Template ${index + 1}: tags must be an array`);
  }

  const parsedTags = (input.tags as unknown[] | undefined ?? []).map((tag, tagIndex) =>
    parseLocalizedTag(tag, index, tagIndex)
  );

  const questions = normalizeQuestions(
    input.questions.map((question, questionIndex) => validateQuestion(question, index, questionIndex))
  );

  return {
    title: normalizeTemplateTitle(title.fallback),
    description: normalizeTemplateDescription(description.fallback),
    titleTranslations: title.translations,
    descriptionTranslations: description.translations,
    tags: normalizeTemplateTags([...parsedTags.map((tag) => tag.fallback), ...selectedTags]),
    tagTranslations: [...parsedTags.map((tag) => tag.translations ?? {}), ...selectedTags.map(() => ({}))],
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
