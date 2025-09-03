"use client";

import React from "react";
import { useTheme } from "next-themes";
import { tokenScoreToColor } from "@/lib/colors";
import { useColorScale } from "@/components/ColorScaleContext";

export interface TokenScoresBoxProps {
  tokenScores: Array<[string, number]>;
  className?: string;
}

export function TokenScoresBox({ tokenScores, className }: TokenScoresBoxProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { maxAbsScore } = useColorScale();

  // Precompute ranks so external code (tour) can select top-N without re-sorting by DOM
  const positiveIndices = tokenScores
    .map(([, score], i) => ({ i, score }))
    .filter(({ score }) => score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .map(({ i }) => i);
  const negativeIndices = tokenScores
    .map(([, score], i) => ({ i, score }))
    .filter(({ score }) => score <= -0.5)
    .sort((a, b) => a.score - b.score) // most negative first
    .map(({ i }) => i);

  const positiveRankByIndex: Record<number, number> = {};
  const negativeRankByIndex: Record<number, number> = {};
  positiveIndices.forEach((idx, rank) => { positiveRankByIndex[idx] = rank + 1; });
  negativeIndices.forEach((idx, rank) => { negativeRankByIndex[idx] = rank + 1; });

  return (
    <div
      className={"whitespace-wrap text-neutral-900 dark:text-neutral-100 " + (className ?? "")}
      data-tour="explainer-tokens"
    >
      {tokenScores.map(([tok, score], i) => {
        const bucket = score >= 0.5 ? "token-positive" : score <= -0.5 ? "token-negative" : "token-neutral";
        const attrs: Record<string, string | number> = { "data-score": score.toFixed(2) };
        if (positiveRankByIndex[i]) attrs["data-rank-positive"] = positiveRankByIndex[i];
        if (negativeRankByIndex[i]) attrs["data-rank-negative"] = negativeRankByIndex[i];
        return (
          <span
            key={i}
            title={score.toFixed(2)}
            style={{ backgroundColor: tokenScoreToColor(score, isDark, maxAbsScore) }}
            className={"px-0.5 " + bucket}
            {...attrs}
          >
            {tok}
          </span>
        );
      })}
    </div>
  );
}