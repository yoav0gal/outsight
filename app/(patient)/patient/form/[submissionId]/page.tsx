"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
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

type AnswerValue = string | number | boolean | string[];

export default function QuestionnaireFormPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("Questionnaire");
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
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto p-6 pt-0 pb-10 sm:pt-0 sm:pb-16">
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
            {instance.template.title}
          </h1>
        </div>

        <div className="space-y-8">
          {instance.template.questions.map((question, index) => {
              const answer = instance.answers?.find(a => a.questionId === question.id)?.value;
              
              return (
                <Card key={question.id} className="border-zinc-200 shadow-sm rounded-3xl overflow-hidden opacity-80">
                  <CardHeader className="bg-white p-6 sm:p-8">
                    <CardTitle className="text-xl leading-relaxed font-bold text-zinc-900 flex items-start gap-3">
                      <span className="text-indigo-400 font-mono text-lg mt-0.5">{index + 1}.</span>
                      <span>{question.prompt}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8 sm:px-8 bg-zinc-50/50">
                    <div className="p-4 bg-white rounded-xl border border-zinc-200 text-zinc-700 font-medium">
                      {answer !== undefined ? String(answer) : <span className="text-zinc-400 italic">{t("noAnswer")}</span>}
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
    <main className="flex-1 w-full max-w-3xl mx-auto p-6 pt-0 pb-10 sm:pt-0 sm:pb-16">
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
            {instance.template.title}
          </h1>
          {instance.template.description && (
            <p className="text-xl text-zinc-600 max-w-2xl">
              {instance.template.description}
            </p>
          )}
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
          {instance.template.questions.map((question, index) => (
            (() => {
              const answer = answers[question.id];
              const textAnswer = typeof answer === "string" ? answer : "";
              const booleanAnswer = answer === true;
              const numericAnswer = typeof answer === "number" ? answer : question.scaleConfig?.min ?? 0;
              const choiceAnswer = typeof answer === "string" ? answer : "";

              return (
            <Card key={question.id} className="border-zinc-200 shadow-sm rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
              <CardHeader className="bg-white p-6 sm:p-8">
                <CardTitle className="text-xl leading-relaxed font-bold text-zinc-900 flex items-start gap-3">
                  <span className="text-indigo-400 font-mono text-lg mt-0.5">{index + 1}.</span>
                  <span>
                    {question.prompt}
                    {question.required && <span className="text-red-500 ms-1">*</span>}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-8 sm:px-8 bg-zinc-50/50">

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
                      {booleanAnswer ? "Yes" : "No"}
                    </Label>
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
                        <span className="text-base font-medium">{option}</span>
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
                      <span>{question.scaleConfig.minLabel || question.scaleConfig.min}</span>
                      <span className="text-indigo-600 font-bold text-lg">{numericAnswer}</span>
                      <span>{question.scaleConfig.maxLabel || question.scaleConfig.max}</span>
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
