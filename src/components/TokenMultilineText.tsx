"use client";

import React from "react";
import type { TokenScores } from "@/lib/types";
import { useTokenLayout } from "@/hooks/useTokenLayout";
import { tokenScoreToColor } from "@/lib/colors";
import { useTheme } from "next-themes";
import { useColorScale } from "./ColorScaleContext";

export interface TokenMultilineTextProps {
    tokenScores: TokenScores;
    numLines?: number; // if 0 => free-flow mode
    paddingPx?: number;
    onHover?: (tokenIdx: number, token: string, score: number) => void;
    className?: string;
}

export function TokenMultilineText({ tokenScores, numLines = 1, paddingPx = 4, onHover, className }: TokenMultilineTextProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const { maxAbsScore } = useColorScale();
    const { containerRef, lines, bgByIndex } = useTokenLayout(tokenScores, numLines === 0 ? 1 : numLines, paddingPx);

    // Free-flow mode (TokenScoresBox behavior)
    if (numLines === 0) {
        // Rankings for external selection (tour) parity with TokenScoresBox
        const positiveIndices = tokenScores
            .map(([, score], i) => ({ i, score }))
            .filter(({ score }) => score >= 0.5)
            .sort((a, b) => b.score - a.score)
            .map(({ i }) => i);
        const negativeIndices = tokenScores
            .map(([, score], i) => ({ i, score }))
            .filter(({ score }) => score <= -0.5)
            .sort((a, b) => a.score - b.score)
            .map(({ i }) => i);

        const positiveRankByIndex: Record<number, number> = {};
        const negativeRankByIndex: Record<number, number> = {};
        positiveIndices.forEach((idx, rank) => { positiveRankByIndex[idx] = rank + 1; });
        negativeIndices.forEach((idx, rank) => { negativeRankByIndex[idx] = rank + 1; });

        return (
            <div className={"whitespace-wrap text-neutral-900 dark:text-neutral-100 " + (className ?? "")}>
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

    // Multiline (wrapped) mode
    // Rankings for tour highlight in wrapped mode as well
    const positiveIndices = tokenScores
        .map(([, score], i) => ({ i, score }))
        .filter(({ score }) => score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .map(({ i }) => i);
    const negativeIndices = tokenScores
        .map(([, score], i) => ({ i, score }))
        .filter(({ score }) => score <= -0.5)
        .sort((a, b) => a.score - b.score)
        .map(({ i }) => i);
    const positiveRankByIndex: Record<number, number> = {};
    const negativeRankByIndex: Record<number, number> = {};
    positiveIndices.forEach((idx, rank) => { positiveRankByIndex[idx] = rank + 1; });
    negativeIndices.forEach((idx, rank) => { negativeRankByIndex[idx] = rank + 1; });

  return (
      <div ref={containerRef} className={"overflow-x-auto whitespace-nowrap " + (className ?? "")}>
      {lines.map((line, lineIdx) => (
        <div key={lineIdx}>
              {line.map(({ index }) => {
            const [tok, score] = tokenScores[index];
                  const attrs: Record<string, string | number> = {};
                  if (positiveRankByIndex[index]) attrs["data-rank-positive"] = positiveRankByIndex[index];
                  if (negativeRankByIndex[index]) attrs["data-rank-negative"] = negativeRankByIndex[index];
            return (
              <span
                key={index}
                className="inline-block align-top"
                    style={{ backgroundColor: bgByIndex[index], paddingRight: `${paddingPx}px`, paddingLeft: `${paddingPx}px` }}
                onMouseEnter={() => onHover?.(index, tok, score)}
                title={tok}
                    {...attrs}
              >
                {tok}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}