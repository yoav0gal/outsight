"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Plus, Trash2, X } from "lucide-react";

import {
  createEmptyQuestion,
  createEmptyTemplateValues,
  normalizeQuestions,
  normalizeTemplateDescriptionTranslations,
  resolveFallbackText,
  normalizeTemplateDescription,
  normalizeTemplateTags,
  normalizeTemplateTitleTranslations,
  normalizeTemplateTitle,
  type LocalizedText,
  type QuestionType,
  type SupportedLocale,
  type TemplateEditorValues,
  type TemplateQuestion,
} from "@/lib/templateEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface TemplateEditorFormProps {
  mode: "create" | "edit";
  initialValues?: TemplateEditorValues;
  availableTags: string[];
  isSubmitting: boolean;
  onSubmit: (values: TemplateEditorValues) => Promise<void>;
  onCancel: () => void;
  backLabel: string;
  onBack: () => void;
  titleError?: string;
  clearTitleError?: () => void;
  canEditTags?: boolean;
  showTags?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  submitLabel?: string;
}

function hydrateQuestionTranslations(question: TemplateQuestion): TemplateQuestion {
  return {
    ...question,
    promptTranslations: question.promptTranslations ?? {
      en: question.prompt,
      he: "",
    },
    optionTranslations: question.options?.map((option, index) => {
      const existingTranslations = question.optionTranslations?.[index];
      return existingTranslations ?? { en: option, he: "" };
    }),
    scaleConfig: question.scaleConfig
      ? {
          ...question.scaleConfig,
          minLabelTranslations: question.scaleConfig.minLabelTranslations ?? {
            en: question.scaleConfig.minLabel ?? "",
            he: "",
          },
          maxLabelTranslations: question.scaleConfig.maxLabelTranslations ?? {
            en: question.scaleConfig.maxLabel ?? "",
            he: "",
          },
        }
      : undefined,
  };
}

export function TemplateEditorForm({
  mode,
  initialValues,
  availableTags,
  isSubmitting,
  onSubmit,
  onCancel,
  backLabel,
  onBack,
  titleError,
  clearTitleError,
  canEditTags = true,
  showTags = true,
  pageTitle,
  pageDescription,
  submitLabel,
}: TemplateEditorFormProps) {
  const t = useTranslations("CreateTemplate");
  const seedValues = initialValues ?? createEmptyTemplateValues();
  const [title, setTitle] = useState(seedValues.title);
  const [description, setDescription] = useState(seedValues.description);
  const [titleTranslations, setTitleTranslations] = useState<LocalizedText>(
    seedValues.titleTranslations ?? { en: seedValues.title, he: seedValues.title }
  );
  const [descriptionTranslations, setDescriptionTranslations] = useState<LocalizedText>(
    seedValues.descriptionTranslations ?? {
      en: seedValues.description,
      he: seedValues.description,
    }
  );
  const [tags, setTags] = useState<string[]>(seedValues.tags);
  const [tagTranslations] = useState<LocalizedText[]>(seedValues.tagTranslations ?? []);
  const [customTag, setCustomTag] = useState("");
  const [questions, setQuestions] = useState<TemplateQuestion[]>(
    seedValues.questions.map((question) => hydrateQuestionTranslations(question))
  );
  const [scoring] = useState(seedValues.scoring);

  const toggleTag = (tag: string) => {
    if (!canEditTags) return;

    setTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const addCustomTag = () => {
    if (!canEditTags) return;

    const normalizedTag = customTag.trim();
    if (!normalizedTag) return;

    const exists = tags.some(
      (tag) => tag.trim().toLocaleLowerCase() === normalizedTag.toLocaleLowerCase()
    );
    if (!exists) {
      setTags((currentTags) => [...currentTags, normalizedTag]);
    }
    setCustomTag("");
  };

  const removeTag = (tagToRemove: string) => {
    if (!canEditTags) return;
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddQuestion = () => {
    setQuestions((currentQuestions) => [...currentQuestions, createEmptyQuestion()]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<TemplateQuestion>) => {
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      nextQuestions[index] = { ...nextQuestions[index], ...updates };
      return nextQuestions;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      nextQuestions.splice(index, 1);
      return nextQuestions;
    });
  };

  const handleMoveQuestionUp = (index: number) => {
    if (index <= 0) return;
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      const temp = nextQuestions[index];
      nextQuestions[index] = nextQuestions[index - 1];
      nextQuestions[index - 1] = temp;
      return nextQuestions;
    });
  };

  const handleMoveQuestionDown = (index: number) => {
    if (index >= questions.length - 1) return;
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      const temp = nextQuestions[index];
      nextQuestions[index] = nextQuestions[index + 1];
      nextQuestions[index + 1] = temp;
      return nextQuestions;
    });
  };

  const handleMoveQuestionToTop = (index: number) => {
    if (index <= 0) return;
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      const [question] = nextQuestions.splice(index, 1);
      nextQuestions.unshift(question);
      return nextQuestions;
    });
  };

  const handleMoveQuestionToBottom = (index: number) => {
    if (index >= questions.length - 1) return;
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      const [question] = nextQuestions.splice(index, 1);
      nextQuestions.push(question);
      return nextQuestions;
    });
  };

  const handleAddOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const options = question.options || [];
    const optionTranslations = question.optionTranslations || [];
    handleUpdateQuestion(questionIndex, {
      options: [...options, ""],
      optionTranslations: [...optionTranslations, { en: "", he: "" }],
    });
  };

  const updateLocalizedValue = (
    currentValue: LocalizedText | undefined,
    locale: SupportedLocale,
    value: string
  ) => ({
    ...(currentValue ?? {}),
    [locale]: value,
  });

  const handleUpdatePrompt = (
    questionIndex: number,
    locale: SupportedLocale,
    value: string
  ) => {
    const question = questions[questionIndex];
    const promptTranslations = updateLocalizedValue(question.promptTranslations, locale, value);
    handleUpdateQuestion(questionIndex, {
      prompt: resolveFallbackText(question.prompt, promptTranslations),
      promptTranslations,
    });
  };

  const handleUpdateOption = (
    questionIndex: number,
    optionIndex: number,
    locale: SupportedLocale,
    value: string
  ) => {
    const question = questions[questionIndex];
    const nextOptionTranslations = [...(question.optionTranslations ?? [])];
    nextOptionTranslations[optionIndex] = updateLocalizedValue(
      nextOptionTranslations[optionIndex],
      locale,
      value
    );

    const nextOptions = [...(question.options ?? [])];
    nextOptions[optionIndex] = resolveFallbackText(nextOptions[optionIndex], nextOptionTranslations[optionIndex]);

    handleUpdateQuestion(questionIndex, {
      options: nextOptions,
      optionTranslations: nextOptionTranslations,
    });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (!question.options) return;
    const options = [...question.options];
    const optionTranslations = [...(question.optionTranslations ?? [])];
    options.splice(optionIndex, 1);
    optionTranslations.splice(optionIndex, 1);
    handleUpdateQuestion(questionIndex, { options, optionTranslations });
  };

  const handleUpdateScaleLabel = (
    questionIndex: number,
    field: "minLabel" | "maxLabel",
    locale: SupportedLocale,
    value: string
  ) => {
    const question = questions[questionIndex];
    if (!question.scaleConfig) return;

    const translationField =
      field === "minLabel" ? "minLabelTranslations" : "maxLabelTranslations";
    const nextTranslations = updateLocalizedValue(
      question.scaleConfig[translationField],
      locale,
      value
    );

    handleUpdateQuestion(questionIndex, {
      scaleConfig: {
        ...question.scaleConfig,
        [field]: resolveFallbackText(question.scaleConfig[field], nextTranslations),
        [translationField]: nextTranslations,
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await onSubmit({
      title: normalizeTemplateTitle(resolveFallbackText(title, titleTranslations)),
      description: normalizeTemplateDescription(
        resolveFallbackText(description, descriptionTranslations)
      ),
      titleTranslations: normalizeTemplateTitleTranslations(titleTranslations),
      descriptionTranslations: normalizeTemplateDescriptionTranslations(descriptionTranslations),
      tags: normalizeTemplateTags(tags),
      tagTranslations,
      questions: normalizeQuestions(questions),
      scoring,
    });
  };

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="-ms-4 flex w-fit items-center gap-2 text-zinc-500 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {backLabel}
          </Button>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-white shadow-sm">
          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8">
            <div className="max-w-3xl">
              <Badge className="rounded-full border-none bg-indigo-100 px-3 py-1 text-indigo-700">
                {mode === "edit" ? t("editTitle") : t("title")}
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                {pageTitle ?? (mode === "edit" ? t("editTitle") : t("title"))}
              </h1>
              <p className="mt-3 text-base leading-7 text-zinc-600">
                {pageDescription ?? (mode === "edit" ? t("editDescription") : t("description"))}
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="rounded-[2rem] border-zinc-200/70 bg-white shadow-sm">
            <CardHeader className="px-6 pt-6 sm:px-8">
              <CardTitle>{mode === "edit" ? t("editTitle") : t("title")}</CardTitle>
              <CardDescription>
                {mode === "edit" ? t("editDescription") : t("description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 sm:px-8">
              <div className="space-y-2">
                <Label htmlFor="title">{t("templateName")}</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("templateNameEnglish")}</Label>
                    <Input
                      id="title"
                      value={titleTranslations.en ?? ""}
                      onChange={(event) => {
                        const nextTranslations = { ...titleTranslations, en: event.target.value };
                        setTitleTranslations(nextTranslations);
                        setTitle(resolveFallbackText(title, nextTranslations));
                        clearTitleError?.();
                      }}
                      placeholder={t("templateName")}
                      required
                      aria-invalid={!!titleError}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("templateNameHebrew")}</Label>
                    <Input
                      dir="rtl"
                      value={titleTranslations.he ?? ""}
                      onChange={(event) => {
                        const nextTranslations = { ...titleTranslations, he: event.target.value };
                        setTitleTranslations(nextTranslations);
                        setTitle(resolveFallbackText(title, nextTranslations));
                        clearTitleError?.();
                      }}
                      placeholder={t("templateName")}
                      required
                      aria-invalid={!!titleError}
                    />
                  </div>
                </div>
                {titleError ? <p className="text-sm text-red-600">{titleError}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("templateDesc")}</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("templateDescEnglish")}</Label>
                    <Textarea
                      id="description"
                      value={descriptionTranslations.en ?? ""}
                      onChange={(event) => {
                        const nextTranslations = {
                          ...descriptionTranslations,
                          en: event.target.value,
                        };
                        setDescriptionTranslations(nextTranslations);
                        setDescription(resolveFallbackText(description, nextTranslations));
                      }}
                      placeholder={t("templateDesc")}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("templateDescHebrew")}</Label>
                    <Textarea
                      dir="rtl"
                      value={descriptionTranslations.he ?? ""}
                      onChange={(event) => {
                        const nextTranslations = {
                          ...descriptionTranslations,
                          he: event.target.value,
                        };
                        setDescriptionTranslations(nextTranslations);
                        setDescription(resolveFallbackText(description, nextTranslations));
                      }}
                      placeholder={t("templateDesc")}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {showTags ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{t("tags")}</Label>
                    {!canEditTags ? (
                      <span className="text-xs font-medium text-zinc-500">
                        {t("systemTagsReadonly")}
                      </span>
                    ) : null}
                  </div>

                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700"
                        >
                          <span>{tag}</span>
                          {canEditTags ? (
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ms-2 rounded-full text-zinc-500 transition-colors hover:text-zinc-900"
                              aria-label={t("removeTag", { tag })}
                            >
                              <X className="size-3" />
                            </button>
                          ) : null}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">{t("noTagsSelected")}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={tags.includes(tag) ? "secondary" : "outline"}
                        onClick={() => toggleTag(tag)}
                        className="rounded-full px-4"
                        disabled={!canEditTags}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>

                  {canEditTags ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={customTag}
                        onChange={(event) => setCustomTag(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addCustomTag();
                          }
                        }}
                        placeholder={t("customTagPlaceholder")}
                        className="h-11 rounded-xl border-zinc-200 bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCustomTag}
                        className="h-11 rounded-xl"
                      >
                        <Plus className="size-4" />
                        {t("addCustomTag")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">{t("questions")}</h2>
              <Button type="button" variant="outline" onClick={handleAddQuestion} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t("addQuestion")}
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                {t("questionsEmpty")}
              </div>
            ) : (
              questions.map((question, questionIndex) => (
                <Card
                  key={question.id}
                  className="relative overflow-visible rounded-[1.5rem] border-zinc-200/70 bg-white shadow-sm"
                >
                  <div className="absolute start-3 top-3 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-indigo-600 disabled:opacity-30 p-0"
                      onClick={() => handleMoveQuestionToTop(questionIndex)}
                      disabled={questionIndex === 0}
                      title={t("moveToTop") || "Move to Top"}
                    >
                      <ChevronsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-indigo-600 disabled:opacity-30 p-0"
                      onClick={() => handleMoveQuestionUp(questionIndex)}
                      disabled={questionIndex === 0}
                      title={t("moveUp") || "Move Up"}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-indigo-600 disabled:opacity-30 p-0"
                      onClick={() => handleMoveQuestionDown(questionIndex)}
                      disabled={questionIndex === questions.length - 1}
                      title={t("moveDown") || "Move Down"}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-indigo-600 disabled:opacity-30 p-0"
                      onClick={() => handleMoveQuestionToBottom(questionIndex)}
                      disabled={questionIndex === questions.length - 1}
                      title={t("moveToBottom") || "Move to Bottom"}
                    >
                      <ChevronsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute end-2 top-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleRemoveQuestion(questionIndex)}
                    aria-label={t("removeQuestion")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <CardContent className="space-y-6 px-6 pb-6 pt-6 ps-12 pe-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label>{t("questionPrompt")}</Label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{t("questionPromptEnglish")}</Label>
                            {question.type === "instructions" ? (
                              <Textarea
                                value={question.promptTranslations?.en ?? ""}
                                onChange={(event) =>
                                  handleUpdatePrompt(questionIndex, "en", event.target.value)
                                }
                                required
                                rows={3}
                                className="resize-y"
                              />
                            ) : (
                              <Input
                                value={question.promptTranslations?.en ?? ""}
                                onChange={(event) =>
                                  handleUpdatePrompt(questionIndex, "en", event.target.value)
                                }
                                required
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>{t("questionPromptHebrew")}</Label>
                            {question.type === "instructions" ? (
                              <Textarea
                                dir="rtl"
                                value={question.promptTranslations?.he ?? ""}
                                onChange={(event) =>
                                  handleUpdatePrompt(questionIndex, "he", event.target.value)
                                }
                                required
                                rows={3}
                                className="resize-y"
                              />
                            ) : (
                              <Input
                                dir="rtl"
                                value={question.promptTranslations?.he ?? ""}
                                onChange={(event) =>
                                  handleUpdatePrompt(questionIndex, "he", event.target.value)
                                }
                                required
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("questionType")}</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) => {
                            const nextType = value as QuestionType;
                            const updates: Partial<TemplateQuestion> = { type: nextType };
                            if ((nextType === "multiple_choice" || nextType === "cards") && !question.options) {
                              updates.options = ["Option 1", "Option 2"];
                              updates.optionTranslations = [
                                { en: "", he: "" },
                                { en: "", he: "" },
                              ];
                            }
                            if (nextType === "numeric_scale" && !question.scaleConfig) {
                              updates.scaleConfig = {
                                min: 1,
                                max: 10,
                                minLabel: "",
                                maxLabel: "",
                                minLabelTranslations: { en: "", he: "" },
                                maxLabelTranslations: { en: "", he: "" },
                              };
                            }
                            if (nextType === "instructions") {
                              updates.required = false;
                            }
                            handleUpdateQuestion(questionIndex, updates);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short_text">{t("types.short_text")}</SelectItem>
                            <SelectItem value="long_text">{t("types.long_text")}</SelectItem>
                            <SelectItem value="multiple_choice">{t("types.multiple_choice")}</SelectItem>
                            <SelectItem value="cards">{t("types.cards")}</SelectItem>
                            <SelectItem value="boolean">{t("types.boolean")}</SelectItem>
                            <SelectItem value="numeric_scale">{t("types.numeric_scale")}</SelectItem>
                            <SelectItem value="instructions">{t("types.instructions")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {question.type !== "instructions" && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.required}
                          onCheckedChange={(checked) =>
                            handleUpdateQuestion(questionIndex, { required: checked })
                          }
                          id={`required-${question.id}`}
                        />
                        <Label htmlFor={`required-${question.id}`} className="cursor-pointer">
                          {t("required")}
                        </Label>
                      </div>
                    )}

                    {question.type === "multiple_choice" || question.type === "cards" ? (
                      <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <Label className="font-bold">{t("options")}</Label>
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={`${question.id}-${optionIndex}`} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                            <div className="space-y-2">
                              <Label>{t("optionEnglish")}</Label>
                              <Input
                                value={question.optionTranslations?.[optionIndex]?.en ?? ""}
                                onChange={(event) =>
                                  handleUpdateOption(questionIndex, optionIndex, "en", event.target.value)
                                }
                                placeholder={t("optionPlaceholder", { index: optionIndex + 1 })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("optionHebrew")}</Label>
                              <Input
                                dir="rtl"
                                value={question.optionTranslations?.[optionIndex]?.he ?? ""}
                                onChange={(event) =>
                                  handleUpdateOption(questionIndex, optionIndex, "he", event.target.value)
                                }
                                placeholder={t("optionPlaceholder", { index: optionIndex + 1 })}
                                required
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                                disabled={(question.options?.length || 0) <= 2}
                                className="text-zinc-400 hover:text-red-500"
                                aria-label={t("removeOption")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="link" onClick={() => handleAddOption(questionIndex)} className="px-0">
                          <Plus className="me-1 h-4 w-4" />
                          {t("addOption")}
                        </Button>
                      </div>
                    ) : null}

                    {question.type === "numeric_scale" ? (
                      <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("min")}</Label>
                          <Input
                            type="number"
                            value={question.scaleConfig?.min || 1}
                            onChange={(event) =>
                              handleUpdateQuestion(questionIndex, {
                                scaleConfig: {
                                  ...question.scaleConfig!,
                                  min: Number(event.target.value),
                                },
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("max")}</Label>
                          <Input
                            type="number"
                            value={question.scaleConfig?.max || 10}
                            onChange={(event) =>
                              handleUpdateQuestion(questionIndex, {
                                scaleConfig: {
                                  ...question.scaleConfig!,
                                  max: Number(event.target.value),
                                },
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("minLabelEnglish")}</Label>
                          <Input
                            value={question.scaleConfig?.minLabelTranslations?.en ?? ""}
                            onChange={(event) =>
                              handleUpdateScaleLabel(questionIndex, "minLabel", "en", event.target.value)
                            }
                            placeholder={t("minLabelPlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("minLabelHebrew")}</Label>
                          <Input
                            dir="rtl"
                            value={question.scaleConfig?.minLabelTranslations?.he ?? ""}
                            onChange={(event) =>
                              handleUpdateScaleLabel(questionIndex, "minLabel", "he", event.target.value)
                            }
                            placeholder={t("minLabelPlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("maxLabelEnglish")}</Label>
                          <Input
                            value={question.scaleConfig?.maxLabelTranslations?.en ?? ""}
                            onChange={(event) =>
                              handleUpdateScaleLabel(questionIndex, "maxLabel", "en", event.target.value)
                            }
                            placeholder={t("maxLabelPlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("maxLabelHebrew")}</Label>
                          <Input
                            dir="rtl"
                            value={question.scaleConfig?.maxLabelTranslations?.he ?? ""}
                            onChange={(event) =>
                              handleUpdateScaleLabel(questionIndex, "maxLabel", "he", event.target.value)
                            }
                            placeholder={t("maxLabelPlaceholder")}
                          />
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end gap-4 border-t border-zinc-200 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || title.trim() === "" || questions.length === 0}
              className="font-bold"
            >
              {submitLabel ?? (mode === "edit" ? t("update") : t("save"))}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
