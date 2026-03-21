"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { resolveLocalizedText, type TemplateQuestion } from "@/lib/templateEditor";

interface QuestionnairePreviewProps {
  questions: TemplateQuestion[];
  title?: string;
  description?: string;
  answers?: Record<string, string | number | boolean | string[]>;
}

export function QuestionnairePreview({ questions, title, description, answers }: QuestionnairePreviewProps) {
  const t = useTranslations("Questionnaire");
  const locale = useLocale();

  const getPrompt = (question: TemplateQuestion) =>
    resolveLocalizedText(locale, question.prompt, question.promptTranslations);

  const getOptionLabel = (question: TemplateQuestion, optionIndex: number) =>
    resolveLocalizedText(
      locale,
      question.options?.[optionIndex],
      question.optionTranslations?.[optionIndex]
    );

  const getAnswerLabel = (
    question: TemplateQuestion,
    answer: string | number | boolean | string[] | undefined
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

      <div className="space-y-3">
        {questions.map((question, index) => {
          const hasAnswer = answers && answers[question.id] !== undefined;
          const answer = answers ? answers[question.id] : undefined;
          const cardOptions = question.options ?? [];
          const isCardsQuestion = question.type === "cards" && cardOptions.length > 0;

          return (
            <Card key={question.id} className={`overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.08)] ${hasAnswer ? 'opacity-90' : ''}`}>
              {question.type !== "cards" ? (
                <CardHeader className="bg-white p-6 sm:p-8">
                  <CardTitle className="flex items-start gap-3 text-xl font-bold leading-relaxed text-zinc-900">
                    <span className="mt-0.5 font-mono text-lg text-indigo-400">{index + 1}.</span>
                    <span>
                      {getPrompt(question)}
                      {!hasAnswer && question.required && <span className="ms-1 text-red-500">*</span>}
                    </span>
                  </CardTitle>
                </CardHeader>
              ) : null}
              <CardContent className={isCardsQuestion ? "space-y-5 p-4 sm:space-y-5 sm:p-5" : "bg-zinc-50/50 px-6 pb-8 sm:px-8"}>
                
                {isCardsQuestion ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      {answer !== undefined ? (
                        <span className="inline-flex max-w-[52%] items-center rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm sm:px-3.5 sm:text-xs">
                          <span className="min-w-0 truncate">{getAnswerLabel(question, answer)}</span>
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

                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${cardOptions.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {cardOptions.map((option, optionIndex) => {
                        const isSelected = answer === option;

                        return (
                            <div
                              key={optionIndex}
                              className={`flex min-h-14 min-w-0 items-center justify-center rounded-[1.5rem] border px-3 py-2 text-center transition-colors sm:min-h-15 sm:px-3.5 sm:py-2.5 ${
                                isSelected
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-[0_6px_18px_rgba(99,102,241,0.16)]"
                                  : "border-zinc-200 bg-white text-zinc-500"
                              }`}
                            >
                              <span className="min-w-0 whitespace-normal break-words text-center text-[11px] font-medium leading-[1.2] sm:text-[13px] sm:leading-[1.25]">
                                {getOptionLabel(question, optionIndex)}
                              </span>
                            </div>
                        );
                      })}
                    </div>
                  </>
                ) : hasAnswer ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 text-lg font-bold text-zinc-700 shadow-inner">
                    {answer !== undefined ? getAnswerLabel(question, answer) : <span className="text-zinc-400 italic">{t("noAnswer")}</span>}
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
                          {t("yes")} / {t("no")}
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
                            <span className="text-base font-medium">{getOptionLabel(question, i)}</span>
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
                          <span>
                            {resolveLocalizedText(
                              locale,
                              question.scaleConfig.minLabel || String(question.scaleConfig.min),
                              question.scaleConfig.minLabelTranslations
                            )}
                          </span>
                          <span className="text-indigo-600 font-bold text-lg">{question.scaleConfig.min}</span>
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
