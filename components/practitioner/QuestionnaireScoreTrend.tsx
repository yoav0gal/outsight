"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type ScorePoint = {
  id: string;
  label: string;
  timestamp: number;
  score: {
    value: number;
    max: number | null;
  };
};

interface QuestionnaireScoreTrendProps {
  points: ScorePoint[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 220;
const PADDING_X = 22;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 42;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function QuestionnaireScoreTrend({ points }: QuestionnaireScoreTrendProps) {
  const t = useTranslations("PractitionerPatient");
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) {
        setMounted(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const chart = useMemo(() => {
    if (!points.length) {
      return null;
    }

    const orderedPoints = [...points].sort((a, b) => a.timestamp - b.timestamp);
    const maxScoreValue = orderedPoints.reduce((highest, point) => {
      const candidate = point.score.max ?? point.score.value;
      return Math.max(highest, candidate);
    }, 0);
    const safeMaxScore = maxScoreValue > 0 ? maxScoreValue : 1;
    const innerWidth = CHART_WIDTH - PADDING_X * 2;
    const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const coordinates = (() => {
      const minTime = orderedPoints[0].timestamp;
      const maxTime = orderedPoints[orderedPoints.length - 1].timestamp;
      const timeSpan = maxTime - minTime;

      return orderedPoints.map((point) => {
        const x =
          timeSpan === 0
            ? CHART_WIDTH / 2
            : PADDING_X + (innerWidth * (point.timestamp - minTime)) / timeSpan;
        const y =
          PADDING_TOP +
          innerHeight -
          clamp((point.score.value / safeMaxScore) * innerHeight, 0, innerHeight);

        return {
          ...point,
          x,
          y,
        };
      });
    })();

    const path = coordinates
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const gridLines = [0, 0.5, 1].map((ratio) => ({
      y: PADDING_TOP + innerHeight * ratio,
      label: Math.round(safeMaxScore * (1 - ratio)),
    }));

    return {
      coordinates,
      gridLines,
      path,
      maxScore: safeMaxScore,
    };
  }, [points]);

  const hoveredPoint = chart?.coordinates.find((point) => point.id === hoveredPointId) ?? null;

  if (!chart) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-zinc-200 bg-white/80 px-6 py-10 text-center text-sm font-medium text-zinc-500">
        {t("questionnaires.noScoredResponses")}
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(180deg,rgba(238,242,255,0.52),rgba(255,255,255,0.98))] p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">
            {t("questionnaires.scoreTrendEyebrow")}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            {t("questionnaires.scoreTrendTitle")}
          </h2>
        </div>
        <p className="text-sm font-medium text-zinc-500">
          {t("questionnaires.scoreTrendRange", {
            count: chart.coordinates.length,
          })}
        </p>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={t("questionnaires.scoreTrendTitle")}
        >
          <defs>
            <linearGradient id="questionnaire-score-line" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="rgb(99 102 241)" />
              <stop offset="100%" stopColor="rgb(16 185 129)" />
            </linearGradient>
          </defs>

          {chart.gridLines.map((line) => (
            <g key={line.label}>
              <line
                x1={PADDING_X}
                x2={CHART_WIDTH - PADDING_X}
                y1={line.y}
                y2={line.y}
                stroke="rgb(228 228 231)"
                strokeDasharray="4 6"
              />
              <text
                x={PADDING_X}
                y={line.y - 6}
                fill="rgb(113 113 122)"
                fontSize="12"
                fontWeight="600"
              >
                {line.label}
              </text>
            </g>
          ))}

          <path
            d={chart.path}
            fill="none"
            stroke="url(#questionnaire-score-line)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />

          {chart.coordinates.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                fill="white"
                r="8"
                stroke="rgb(79 70 229)"
                strokeWidth="3"
              />
              <circle
                cx={point.x}
                cy={point.y}
                fill="transparent"
                r="18"
                onMouseEnter={() => setHoveredPointId(point.id)}
                onMouseLeave={() => setHoveredPointId((current) => (current === point.id ? null : current))}
              />
              <text
                x={point.x}
                y={CHART_HEIGHT - 12}
                textAnchor="middle"
                fill="rgb(113 113 122)"
                fontSize="12"
                fontWeight="600"
              >
                {mounted
                  ? new Date(point.timestamp).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "numeric",
                    })
                  : ""}
              </text>
            </g>
          ))}
        </svg>

        {hoveredPoint ? (
          <div
            className="pointer-events-none absolute top-3 z-10 min-w-44 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 text-start shadow-lg backdrop-blur-sm"
            style={{
              left: `${((hoveredPoint.x / CHART_WIDTH) * 100).toFixed(2)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
              {t("questionnaires.scoreTooltipLabel")}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {hoveredPoint.score.max === null
                ? t("questionnaires.score", { value: hoveredPoint.score.value })
                : t("questionnaires.scoreWithMax", {
                    value: hoveredPoint.score.value,
                    max: hoveredPoint.score.max,
                  })}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              {t("questionnaires.lastAdded", {
                date: new Date(hoveredPoint.timestamp).toLocaleString(),
              })}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
