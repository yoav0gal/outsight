export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "cards"
  | "boolean"
  | "numeric_scale"
  | "instructions";

export type SupportedLocale = "en" | "he";

export interface LocalizedText {
  en?: string;
  he?: string;
}

export interface TemplateQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  promptTranslations?: LocalizedText;
  required: boolean;
  includedInScoring?: boolean; // Defaults to true when absent
  options?: string[];
  optionTranslations?: LocalizedText[];
  scaleConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
    minLabelTranslations?: LocalizedText;
    maxLabelTranslations?: LocalizedText;
  };
}

export interface TemplateScoring {
  mode: "standard";
  includedQuestionIds: string[];
  answerScores?: Record<string, Record<string, number>>;
}

export interface TemplateEditorValues {
  title: string;
  description: string;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  tags: string[];
  tagTranslations?: LocalizedText[];
  questions: TemplateQuestion[];
  scoring?: TemplateScoring;
}

export function createEmptyQuestion(): TemplateQuestion {
  return {
    id: `q_${Date.now()}`,
    type: "short_text",
    prompt: "",
    promptTranslations: { en: "", he: "" },
    required: true,
  };
}

export function normalizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

export function normalizeTemplateDescription(description: string) {
  return description.trim();
}

export function normalizeTemplateTitleTranslations(titleTranslations?: LocalizedText) {
  return normalizeLocalizedText(titleTranslations);
}

export function normalizeTemplateDescriptionTranslations(descriptionTranslations?: LocalizedText) {
  return normalizeLocalizedText(descriptionTranslations);
}

export function normalizeTemplateTags(tags: string[]) {
  return [...tags]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, collection) => {
      const current = tag.toLocaleLowerCase();
      return collection.findIndex((candidate) => candidate.toLocaleLowerCase() === current) === index;
    })
    .sort((a, b) => a.localeCompare(b));
}

export function normalizeTemplateTagTranslations(tagTranslations?: LocalizedText[]) {
  if (!tagTranslations) return undefined;

  const normalized = normalizeLocalizedTextArray(tagTranslations);
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeQuestions(questions: TemplateQuestion[]) {
  return questions.map((question) => {
    const promptTranslations = normalizeLocalizedText(question.promptTranslations);
    const prompt = resolveFallbackText(question.prompt, promptTranslations);

    if (question.type === "multiple_choice" || question.type === "cards") {
      const optionTranslations = normalizeLocalizedTextArray(question.optionTranslations);
      const options = buildNormalizedOptions(question.options, optionTranslations);

      return {
        ...question,
        prompt,
        promptTranslations,
        options: options.length > 0 ? options : ["Option 1", "Option 2"],
        optionTranslations: optionTranslations.length > 0 ? optionTranslations : undefined,
        scaleConfig: undefined,
      };
    }

    if (question.type === "numeric_scale") {
      const scaleConfig = question.scaleConfig ?? { min: 1, max: 10, minLabel: "", maxLabel: "" };
      const minLabelTranslations = normalizeLocalizedText(scaleConfig.minLabelTranslations);
      const maxLabelTranslations = normalizeLocalizedText(scaleConfig.maxLabelTranslations);

      return {
        ...question,
        prompt,
        promptTranslations,
        options: undefined,
        optionTranslations: undefined,
        scaleConfig: {
          ...scaleConfig,
          minLabel: resolveFallbackText(scaleConfig.minLabel, minLabelTranslations),
          maxLabel: resolveFallbackText(scaleConfig.maxLabel, maxLabelTranslations),
          minLabelTranslations,
          maxLabelTranslations,
        },
      };
    }

    return {
      ...question,
      prompt,
      promptTranslations,
      options: undefined,
      optionTranslations: undefined,
      scaleConfig: undefined,
    };
  });
}

export function createEmptyTemplateValues(): TemplateEditorValues {
  return {
    title: "",
    description: "",
    titleTranslations: { en: "", he: "" },
    descriptionTranslations: { en: "", he: "" },
    tags: [],
    tagTranslations: [],
    questions: [],
    scoring: undefined,
  };
}

export function normalizeLocalizedText(value?: LocalizedText) {
  if (!value) return undefined;

  const normalized: LocalizedText = {};

  if (typeof value.en === "string") {
    const trimmed = value.en.trim();
    if (trimmed) normalized.en = trimmed;
  }

  if (typeof value.he === "string") {
    const trimmed = value.he.trim();
    if (trimmed) normalized.he = trimmed;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function normalizeLocalizedTextArray(values?: LocalizedText[]) {
  if (!values) return [];
  return values.map((value) => normalizeLocalizedText(value) ?? {});
}

export function resolveFallbackText(value?: string, translations?: LocalizedText) {
  const trimmedValue = value?.trim();
  return (
    translations?.en?.trim() ||
    translations?.he?.trim() ||
    trimmedValue ||
    ""
  );
}

export function resolveLocalizedText(
  locale: string,
  value?: string,
  translations?: LocalizedText
) {
  const normalizedLocale: SupportedLocale = locale === "en" ? "en" : "he";
  const alternateLocale: SupportedLocale = normalizedLocale === "en" ? "he" : "en";

  return (
    translations?.[normalizedLocale]?.trim() ||
    translations?.[alternateLocale]?.trim() ||
    value?.trim() ||
    ""
  );
}

function buildNormalizedOptions(options?: string[], optionTranslations?: LocalizedText[]) {
  const maxLength = Math.max(options?.length ?? 0, optionTranslations?.length ?? 0);
  const normalizedOptions: string[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const option = options?.[index];
    const translations = optionTranslations?.[index];
    const fallback = resolveFallbackText(option, translations);

    if (fallback) {
      normalizedOptions.push(fallback);
    }
  }

  return normalizedOptions;
}
