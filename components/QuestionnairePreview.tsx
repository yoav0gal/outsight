"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface Question {
  id: string;
  prompt: string;
  type: string;
  required?: boolean;
  options?: string[];
  scaleConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
  };
}

interface QuestionnairePreviewProps {
  questions: Question[];
  title?: string;
  description?: string;
  answers?: Record<string, any>;
}

export function QuestionnairePreview({ questions, title, description, answers }: QuestionnairePreviewProps) {
  const t = useTranslations("Questionnaire");

  return (
    <div className="space-y-8 pb-8">
      {(title || description) && (
        <div className="text-center sm:text-start mb-12">
          {title && (
            <h1 className="text-4xl font-black text-zinc-950 mb-4 tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => {
          const hasAnswer = answers && answers[question.id] !== undefined;
          const answer = answers ? answers[question.id] : undefined;

          return (
            <Card key={question.id} className={`border-zinc-200 shadow-sm rounded-3xl overflow-hidden ${hasAnswer ? 'opacity-90' : ''}`}>
              <CardHeader className="bg-white p-6 sm:p-8">
                <CardTitle className="text-xl leading-relaxed font-bold text-zinc-900 flex items-start gap-3">
                  <span className="text-indigo-400 font-mono text-lg mt-0.5">{index + 1}.</span>
                  <span>
                    {question.prompt}
                    {!hasAnswer && question.required && <span className="text-red-500 ms-1">*</span>}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-8 sm:px-8 bg-zinc-50/50">
                
                {hasAnswer ? (
                  <div className="p-4 bg-white rounded-xl border border-zinc-200 text-zinc-700 font-bold text-lg shadow-inner">
                    {answer !== undefined ? String(answer) : <span className="text-zinc-400 italic">{t("noAnswer")}</span>}
                  </div>
                ) : (
                  <>
                    {question.type === "short_text" && (
                      <Input 
                        disabled
                        placeholder={t("typeAnswer")}
                        className="h-14 rounded-xl text-base bg-white border-zinc-200 shadow-sm opacity-50"
                      />
                    )}

                    {question.type === "long_text" && (
                      <Textarea 
                        disabled
                        placeholder={t("typeAnswer")}
                        className="min-h-[120px] rounded-xl text-base bg-white border-zinc-200 shadow-sm resize-none p-4 opacity-50"
                      />
                    )}

                    {question.type === "boolean" && (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm w-fit opacity-50">
                        <Switch disabled />
                        <Label className="text-base font-medium">
                          Yes / No
                        </Label>
                      </div>
                    )}

                    {question.type === "multiple_choice" && question.options && (
                      <RadioGroup disabled className="grid gap-3">
                        {question.options.map((option, i) => (
                          <Label 
                            key={i} 
                            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white opacity-50"
                          >
                            <RadioGroupItem value={option} className="w-5 h-5 text-indigo-600" />
                            <span className="text-base font-medium">{option}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    )}

                    {question.type === "numeric_scale" && question.scaleConfig && (
                      <div className="space-y-8 py-4 px-2 opacity-50">
                        <Slider 
                          disabled
                          value={[question.scaleConfig.min]}
                          min={question.scaleConfig.min}
                          max={question.scaleConfig.max}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between text-sm font-semibold text-zinc-500">
                          <span>{question.scaleConfig.minLabel || question.scaleConfig.min}</span>
                          <span className="text-indigo-600 font-bold text-lg">{question.scaleConfig.min}</span>
                          <span>{question.scaleConfig.maxLabel || question.scaleConfig.max}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
