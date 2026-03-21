"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { resolveLocalizedText, type TemplateQuestion } from "@/lib/templateEditor";

type AnswerValue = string | number | boolean | string[];

function formatScoreLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  score:
    | {
        value: number;
        max: number | null;
      }
    | null
    | undefined
) {
  if (!score) return null;

  return score.max === null
    ? t("score", { value: score.value })
    : t("scoreWithMax", { value: score.value, max: score.max });
}

export default function QuestionnaireFormPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("Questionnaire");
  const locale = useLocale();
  const instanceId = params.submissionId as Id<"questionnaireInstances">;

  const instance = useQuery(api.questionnaires.getInstance, { instanceId });
  const submitMutation = useMutation(api.questionnaires.submitInstance);

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize answers if we have them
  useEffect(() => {
    if (instance?.answers) {
      const initial: Record<string, AnswerValue> = {};
      instance.answers.forEach(a => {
        initial[a.questionId] = a.value;
      });
      setAnswers(initial);
    }
  }, [instance?.answers]);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  const getPrompt = (question: TemplateQuestion) =>
    resolveLocalizedText(locale, question.prompt, question.promptTranslations);
  const getTemplateTitle = () =>
    instance?.template
      ? resolveLocalizedText(locale, instance.template.title, instance.template.titleTranslations)
      : "";

  const getOptionLabel = (question: TemplateQuestion, optionIndex: number) =>
    resolveLocalizedText(
      locale,
      question.options?.[optionIndex],
      question.optionTranslations?.[optionIndex]
    );

  const getAnswerLabel = (
    question: TemplateQuestion,
    answer: AnswerValue | undefined
  ) => {
    if (typeof answer === "boolean") {
      return answer ? t("yes") : t("no");
    }

    if (typeof answer === "string" && question.options?.length) {
      const optionIndex = question.options.findIndex((option) => option === answer);
      if (optionIndex >= 0) {
        return getOptionLabel(question, optionIndex);
      }
    }

    return answer !== undefined ? String(answer) : t("noAnswer");
  };

  const handleSubmit = async () => {
    if (!instance || !instance.template) return;
    
    // Validate required questions
    for (const q of instance.template.questions) {
      if (q.required && (answers[q.id] === undefined || answers[q.id] === "")) {
        setError(t("requiredField"));
        // Find the element and scroll to it ideally, but a generic error is okay for now
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        value: answers[questionId],
      }));

      await submitMutation({
        instanceId,
        answers: formattedAnswers,
      });

      router.replace("/patient/home");
    } catch (err) {
      console.error(err);
      setError("Failed to submit answers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (instance === undefined) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </main>
    );
  }

  if (instance === null || !instance.template) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">{t("notFound")}</h2>
        <Button onClick={() => router.push("/patient/home")} variant="outline" className="mt-4 rounded-xl">
          {t("goBack")}
        </Button>
      </main>
    );
  }

  if (instance.status !== "pending") {
    const scoreLabel = formatScoreLabel(t, instance.score);

    return (
      <main className="mx-auto flex-1 w-full max-w-5xl p-6 pt-0 pb-10 sm:px-8 sm:pt-0 sm:pb-16 lg:px-10">
        <div className="mb-2 flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors -ms-4"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("back")}</span>
          </Button>
        </div>
        <div className="mb-10 text-center sm:text-start">
          <Badge className={`mb-4 ${instance.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {t(`status.${instance.status}`)}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 mb-4 tracking-tight">
            {getTemplateTitle()}
          </h1>
          {scoreLabel ? (
            <p className="text-sm font-semibold text-indigo-700">{scoreLabel}</p>
          ) : null}
        </div>

        <div className="space-y-8">
          {instance.template.questions.map((question, index) => {
              const answer = instance.answers?.find(a => a.questionId === question.id)?.value;
              
              return (
                <Card key={question.id} className="border-zinc-200 shadow-sm rounded-3xl overflow-hidden opacity-80">
                  <CardHeader className="bg-white p-6 sm:p-8">
                    <CardTitle className="text-xl leading-relaxed font-bold text-zinc-900 flex items-start gap-3">
                      <span className="text-indigo-400 font-mono text-lg mt-0.5">{index + 1}.</span>
                      <span>{getPrompt(question)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8 sm:px-8 bg-zinc-50/50">
                    <div className="p-4 bg-white rounded-xl border border-zinc-200 text-zinc-700 font-medium">
                      {answer !== undefined ? getAnswerLabel(question, answer) : <span className="text-zinc-400 italic">{t("noAnswer")}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
    );
  }

  return (
    <main className="mx-auto flex-1 w-full max-w-5xl p-6 pt-0 pb-10 sm:px-8 sm:pt-0 sm:pb-16 lg:px-10">
      <div className="mb-2 flex items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors -ms-4"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t("back")}</span>
        </Button>
      </div>
      <div className="mb-10 text-center sm:text-start animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
            {t(`status.${instance.status}`)}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-950 mb-4 tracking-tight">
            {getTemplateTitle()}
          </h1>
        </div>

        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
          {instance.template.questions.map((question, index) => (
            (() => {
              const answer = answers[question.id];
              const textAnswer = typeof answer === "string" ? answer : "";
              const booleanAnswer = answer === true;
              const numericAnswer = typeof answer === "number" ? answer : question.scaleConfig?.min ?? 0;
              const choiceAnswer = typeof answer === "string" ? answer : "";

              return (
            <Card key={question.id} className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.08)] transition-shadow">
              {question.type !== "cards" ? (
                <CardHeader className="bg-white p-6 sm:p-8">
                  <CardTitle className="flex items-start gap-3 text-lg font-bold leading-relaxed text-zinc-900">
                    <span className="mt-0.5 font-mono text-lg text-indigo-400">{index + 1}.</span>
                    <span>
                      {getPrompt(question)}
                      {question.required && <span className="ms-1 text-red-500">*</span>}
                    </span>
                  </CardTitle>
                </CardHeader>
              ) : null}
              <CardContent className={question.type === "cards" ? "space-y-5 p-4 sm:space-y-5 sm:p-5" : "bg-zinc-50/50 px-6 pb-8 sm:px-8"}>
                {question.type === "cards" && question.options && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      {choiceAnswer ? (
                        <span className="inline-flex max-w-[52%] items-center rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm sm:px-3.5 sm:text-xs">
                          <span className="min-w-0 truncate">{getAnswerLabel(question, choiceAnswer)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex max-w-[52%] items-center rounded-full border border-transparent px-3 py-1 text-[11px] font-medium text-transparent sm:px-3.5 sm:text-xs">
                          .
                        </span>
                      )}
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm sm:px-3.5 sm:text-xs">
                        {t("questionNumber", { index: index + 1 })}
                      </span>
                    </div>

                    <h2 className="max-w-none text-start text-[clamp(1.12rem,3.9vw,1.7rem)] font-black leading-[1.14] tracking-tight text-zinc-950">
                      {getPrompt(question)}
                      {question.required ? <span className="ms-1 text-red-500">*</span> : null}
                    </h2>
                  </>
                )}

                {question.type === "short_text" && (
                  <Input 
                    value={textAnswer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={t("typeAnswer")}
                    className="h-14 rounded-xl text-base bg-white border-zinc-200 focus:border-indigo-500 shadow-sm"
                  />
                )}

                {question.type === "long_text" && (
                  <Textarea 
                    value={textAnswer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={t("typeAnswer")}
                    className="min-h-[120px] rounded-xl text-base bg-white border-zinc-200 focus:border-indigo-500 shadow-sm resize-y p-4"
                  />
                )}

                {question.type === "boolean" && (
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm w-fit">
                    <Switch 
                      checked={booleanAnswer}
                      onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
                    />
                    <Label className="text-base font-medium cursor-pointer" onClick={() => handleAnswerChange(question.id, !booleanAnswer)}>
                      {booleanAnswer ? t("yes") : t("no")}
                    </Label>
                  </div>
                )}

                {question.type === "cards" && question.options && (
                  <div
                    role="radiogroup"
                    aria-label={getPrompt(question)}
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${question.options.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {question.options.map((option, i) => {
                      const isSelected = choiceAnswer === option;

                      return (
                        <button
                          key={i}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleAnswerChange(question.id, option)}
                          className={`flex min-h-13 min-w-0 items-center justify-center rounded-[1.35rem] border px-2.5 py-2 text-center transition-colors select-none outline-none sm:min-h-14 sm:px-3 sm:py-2 ${
                            isSelected
                              ? "border-zinc-900 bg-zinc-100 text-zinc-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                          }`}
                        >
                          <span className="min-w-0 whitespace-normal wrap-break-word text-center text-[10.5px] font-medium leading-[1.15] sm:text-[12px] sm:leading-[1.2]">
                            {getOptionLabel(question, i)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.type === "multiple_choice" && question.options && (
                  <RadioGroup 
                    value={choiceAnswer}
                    onValueChange={(val) => handleAnswerChange(question.id, val)}
                    className="grid gap-3"
                  >
                    {question.options.map((option, i) => (
                      <Label 
                        key={i} 
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                          choiceAnswer === option 
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                            : "border-zinc-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <RadioGroupItem value={option} className="w-5 h-5 text-indigo-600" />
                        <span className="text-base font-medium">{getOptionLabel(question, i)}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {question.type === "numeric_scale" && question.scaleConfig && (
                  <div className="space-y-8 py-4 px-2">
                    <Slider 
                      value={[numericAnswer]}
                      min={question.scaleConfig.min}
                      max={question.scaleConfig.max}
                      step={1}
                      onValueChange={(vals) => handleAnswerChange(question.id, typeof vals === 'number' ? vals : vals[0])}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm font-semibold text-zinc-500">
                      <span>
                        {resolveLocalizedText(
                          locale,
                          question.scaleConfig.minLabel || String(question.scaleConfig.min),
                          question.scaleConfig.minLabelTranslations
                        )}
                      </span>
                      <span className="text-indigo-600 font-bold text-lg">{numericAnswer}</span>
                      <span>
                        {resolveLocalizedText(
                          locale,
                          question.scaleConfig.maxLabel || String(question.scaleConfig.max),
                          question.scaleConfig.maxLabelTranslations
                        )}
                      </span>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
              );
            })()
          ))}
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="mt-12 flex justify-end animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            size="lg"
            className="w-full sm:w-auto px-10 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200"
          >
            {isSubmitting ? "..." : t("submit")}
          </Button>
        </div>
      </main>
  );
}
