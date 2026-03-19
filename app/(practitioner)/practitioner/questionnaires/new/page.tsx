"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, GripVertical, X } from "lucide-react";

type QuestionType = "short_text" | "long_text" | "multiple_choice" | "boolean" | "numeric_scale";

interface Question {
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

function normalizeTemplateTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function normalizeTemplateDescription(description: string) {
  return description.trim();
}

function normalizeTemplateTags(tags: string[]) {
  return [...tags]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeQuestions(questions: Question[]) {
  return questions.map((question) => {
    if (question.type === "multiple_choice") {
      return {
        ...question,
        options: question.options ?? [],
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

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("CreateTemplate");
  const createTemplate = useMutation(api.questionnaires.createTemplate);
  const updateTemplate = useMutation(api.questionnaires.updateTemplate);
  const availableTags = useQuery(api.questionnaires.listTemplateTags);
  const visibleTemplates = useQuery(api.questionnaires.listTemplates);
  const rawTemplateId = searchParams.get("templateId");
  const templateId =
    rawTemplateId && visibleTemplates?.some((template) => template._id === rawTemplateId)
      ? (rawTemplateId as Id<"questionnaireTemplates">)
      : null;
  const existingTemplate = useQuery(
    api.questionnaires.getTemplate,
    templateId ? { templateId } : "skip"
  );
  const isEditing = !!rawTemplateId;
  const isResolvingTemplate = !!rawTemplateId && visibleTemplates === undefined;
  const hasInvalidTemplateId = !!rawTemplateId && visibleTemplates !== undefined && !templateId;
  const isLoadingTemplate = !!templateId && existingTemplate === undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (!existingTemplate) return;

    setTitle(existingTemplate.title);
    setDescription(existingTemplate.description || "");
    setTags(existingTemplate.tags || []);
    setQuestions(existingTemplate.questions);
  }, [existingTemplate]);

  const isSystemTemplate = existingTemplate?.source === "system";

  const hasTemplateChanges = () => {
    if (!existingTemplate) return true;

    return JSON.stringify({
      title: normalizeTemplateTitle(title),
      description: normalizeTemplateDescription(description),
      tags: normalizeTemplateTags(tags),
      questions: normalizeQuestions(questions),
    }) !== JSON.stringify({
      title: normalizeTemplateTitle(existingTemplate.title),
      description: normalizeTemplateDescription(existingTemplate.description || ""),
      tags: normalizeTemplateTags(existingTemplate.tags || []),
      questions: normalizeQuestions(existingTemplate.questions),
    });
  };

  const toggleTag = (tag: string) => {
    if (isSystemTemplate) return;

    setTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const addCustomTag = () => {
    if (isSystemTemplate) return;

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
    if (isSystemTemplate) return;
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}`,
        type: "short_text",
        prompt: "",
        required: true,
      },
    ]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const options = q.options || [];
    handleUpdateQuestion(qIndex, { options: [...options, ""] });
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const q = questions[qIndex];
    if (!q.options) return;
    const options = [...q.options];
    options[oIndex] = value;
    handleUpdateQuestion(qIndex, { options });
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    if (!q.options) return;
    const options = [...q.options];
    options.splice(oIndex, 1);
    handleUpdateQuestion(qIndex, { options });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) return;
    if (isEditing && !templateId) {
      alert(t("invalidTemplate"));
      router.push("/practitioner/questionnaires");
      return;
    }
    
    // Ensure data is clean
    const cleanedQuestions = questions.map(q => {
      const cleanQ = { ...q };
      if (cleanQ.type === "multiple_choice" && (!cleanQ.options || cleanQ.options.length === 0)) {
        cleanQ.options = ["Option 1", "Option 2"];
      }
      if (cleanQ.type === "numeric_scale" && !cleanQ.scaleConfig) {
        cleanQ.scaleConfig = { min: 1, max: 10, minLabel: "", maxLabel: "" };
      }
      return cleanQ;
    });

    if (isEditing && existingTemplate && !hasTemplateChanges()) {
      router.push("/practitioner/questionnaires");
      return;
    }

    setIsSubmitting(true);
    setTitleError("");
    try {
      if (templateId && !isSystemTemplate) {
        await updateTemplate({
          templateId,
          title,
          description,
          tags,
          questions: cleanedQuestions,
        });
      } else {
        await createTemplate({
          title,
          description,
          tags,
          questions: cleanedQuestions,
        });
      }

      alert(isEditing ? t("updatedSuccess") : t("success"));
      router.push("/practitioner/questionnaires");
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes("already exists")) {
        setTitleError(t("duplicateName"));
      }
      alert(isEditing ? t("updatedError") : t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResolvingTemplate || isLoadingTemplate) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full p-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-6 text-sm text-zinc-500">{t("loadingTemplate")}</CardContent>
        </Card>
      </main>
    );
  }

  if (hasInvalidTemplateId || (isEditing && !existingTemplate)) {
    return (
      <main className="flex-1 max-w-4xl mx-auto w-full p-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div>
              <h1 className="text-xl font-semibold text-zinc-950">{t("invalidTemplate")}</h1>
              <p className="mt-2 text-sm text-zinc-500">{t("invalidTemplateDescription")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/practitioner/questionnaires")}
            >
              {t("backToQuestionnaires")}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="w-fit flex items-center gap-2 text-zinc-500 hover:text-indigo-600 -ms-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("backToQuestionnaires")}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>{isEditing ? t("editTitle") : t("title")}</CardTitle>
              <CardDescription>{isEditing ? t("editDescription") : t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("templateName")}</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError("");
                  }}
                  placeholder={t("templateName")} 
                  required 
                  aria-invalid={!!titleError}
                />
                {titleError ? (
                  <p className="text-sm text-red-600">{titleError}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("templateDesc")}</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder={t("templateDesc")} 
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("tags")}</Label>
                  {isSystemTemplate ? (
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
                        {!isSystemTemplate ? (
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
                  {(availableTags ?? []).map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={tags.includes(tag) ? "secondary" : "outline"}
                      onClick={() => toggleTag(tag)}
                      className="rounded-full px-4"
                      disabled={isSystemTemplate}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>

                {!isSystemTemplate ? (
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
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">{t("questions")}</h2>
              <Button type="button" variant="outline" onClick={handleAddQuestion} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t("addQuestion")}
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-12 text-center text-zinc-500">
                {t("questions")}
              </div>
            ) : (
              questions.map((q, qIndex) => (
                <Card key={q.id} className="border-zinc-200 shadow-sm relative overflow-visible">
                  <div className="absolute top-4 start-4 cursor-grab text-zinc-400 hover:text-zinc-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 end-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveQuestion(qIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <CardContent className="pt-6 ps-12 pe-6 pb-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>{t("questionPrompt")}</Label>
                        <Input
                          value={q.prompt}
                          onChange={(e) => handleUpdateQuestion(qIndex, { prompt: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("questionType")}</Label>
                        <Select
                          value={q.type}
                          onValueChange={(val) => {
                            const newType = val as QuestionType;
                            const updates: Partial<Question> = { type: newType };
                            if (newType === "multiple_choice" && !q.options) {
                              updates.options = ["Option 1", "Option 2"];
                            }
                            if (newType === "numeric_scale" && !q.scaleConfig) {
                              updates.scaleConfig = { min: 1, max: 10, minLabel: "", maxLabel: "" };
                            }
                            handleUpdateQuestion(qIndex, updates);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short_text">{t("types.short_text")}</SelectItem>
                            <SelectItem value="long_text">{t("types.long_text")}</SelectItem>
                            <SelectItem value="multiple_choice">{t("types.multiple_choice")}</SelectItem>
                            <SelectItem value="boolean">{t("types.boolean")}</SelectItem>
                            <SelectItem value="numeric_scale">{t("types.numeric_scale")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={q.required}
                        onCheckedChange={(checked) => handleUpdateQuestion(qIndex, { required: checked })}
                        id={`required-${q.id}`}
                      />
                      <Label htmlFor={`required-${q.id}`} className="cursor-pointer">{t("required")}</Label>
                    </div>

                    {q.type === "multiple_choice" && (
                      <div className="space-y-3 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <Label className="font-bold">{t("options")}</Label>
                        {(q.options || []).map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOption(qIndex, oIndex)}
                              disabled={(q.options?.length || 0) <= 2}
                              className="text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="link" onClick={() => handleAddOption(qIndex)} className="px-0">
                          <Plus className="w-4 h-4 me-1" /> {t("addOption")}
                        </Button>
                      </div>
                    )}

                    {q.type === "numeric_scale" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                        <div className="space-y-2">
                          <Label>{t("min")}</Label>
                          <Input
                            type="number"
                            value={q.scaleConfig?.min || 1}
                            onChange={(e) => handleUpdateQuestion(qIndex, { scaleConfig: { ...q.scaleConfig!, min: Number(e.target.value) } })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("max")}</Label>
                          <Input
                            type="number"
                            value={q.scaleConfig?.max || 10}
                            onChange={(e) => handleUpdateQuestion(qIndex, { scaleConfig: { ...q.scaleConfig!, max: Number(e.target.value) } })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("minLabel")}</Label>
                          <Input
                            value={q.scaleConfig?.minLabel || ""}
                            onChange={(e) => handleUpdateQuestion(qIndex, { scaleConfig: { ...q.scaleConfig!, minLabel: e.target.value } })}
                            placeholder="e.g. Very Poor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("maxLabel")}</Label>
                          <Input
                            value={q.scaleConfig?.maxLabel || ""}
                            onChange={(e) => handleUpdateQuestion(qIndex, { scaleConfig: { ...q.scaleConfig!, maxLabel: e.target.value } })}
                            placeholder="e.g. Excellent"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-zinc-200">
            <Button type="button" variant="outline" onClick={() => router.push("/practitioner/questionnaires")} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || title.trim() === "" || questions.length === 0} className="font-bold">
              {isEditing ? t("update") : t("save")}
            </Button>
          </div>
        </form>
    </main>
  );
}
