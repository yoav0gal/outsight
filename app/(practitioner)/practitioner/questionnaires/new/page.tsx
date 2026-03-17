"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";

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

export default function CreateTemplatePage() {
  const router = useRouter();
  const t = useTranslations("CreateTemplate");
  const createTemplate = useMutation(api.questionnaires.createTemplate);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      await createTemplate({
        title,
        description,
        questions: cleanedQuestions,
      });
      alert(t("success"));
      router.push("/practitioner/my-patients");
    } catch (error) {
      console.error(error);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("templateName")}</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder={t("templateName")} 
                  required 
                />
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
            <Button type="button" variant="outline" onClick={() => router.push("/practitioner/my-patients")} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || title.trim() === "" || questions.length === 0} className="font-bold">
              {t("save")}
            </Button>
          </div>
        </form>
      </main>
  );
}
