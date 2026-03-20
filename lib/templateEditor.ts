export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "cards"
  | "boolean"
  | "numeric_scale";

export interface TemplateQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  required: boolean;
  options?: string[];
  scaleConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
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
  tags: string[];
  questions: TemplateQuestion[];
  scoring?: TemplateScoring;
}

export function createEmptyQuestion(): TemplateQuestion {
  return {
    id: `q_${Date.now()}`,
    type: "short_text",
    prompt: "",
    required: true,
  };
}

export function normalizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

export function normalizeTemplateDescription(description: string) {
  return description.trim();
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

export function normalizeQuestions(questions: TemplateQuestion[]) {
  return questions.map((question) => {
    if (question.type === "multiple_choice" || question.type === "cards") {
      return {
        ...question,
        options:
          question.options?.map((option) => option.trim()).filter(Boolean) ?? ["Option 1", "Option 2"],
        scaleConfig: undefined,
      };
    }

    if (question.type === "numeric_scale") {
      return {
        ...question,
        options: undefined,
        scaleConfig: question.scaleConfig ?? { min: 1, max: 10, minLabel: "", maxLabel: "" },
      };
    }

    return {
      ...question,
      options: undefined,
      scaleConfig: undefined,
    };
  });
}

export function createEmptyTemplateValues(): TemplateEditorValues {
  return {
    title: "",
    description: "",
    tags: [],
    questions: [],
    scoring: undefined,
  };
}
