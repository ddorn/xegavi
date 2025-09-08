"use client";

import React from "react";
import type { TokenScores, TokenScoresList } from "@/lib/types";
import { useTokenLayout } from "@/hooks/useTokenLayout";
import { tokenScoreToColor } from "@/lib/colors";
import { useTheme } from "next-themes";
import { useColorScale } from "./ColorScaleContext";

export interface TokenMultilineTextProps {
    tokenScoresList: TokenScoresList;
    numLines?: number; // if 0 => free-flow mode
    paddingPx?: number;
    onHover?: (tokenIdx: number, token: string, score: number, seqIdx: number) => void;
    className?: string;
}

const POS_THRESHOLD = 0.5;
const NEG_THRESHOLD = -0.5;

type RankMaps = {
    positiveRankByIndex: Record<number, number>;
    negativeRankByIndex: Record<number, number>;
};

function computeRankMaps(tokenScores: TokenScores, posThreshold: number, negThreshold: number): RankMaps {
    const positiveIndices = tokenScores
        .map(([, score], i) => ({ i, score }))
        .filter(({ score }) => score >= posThreshold)
        .sort((a, b) => b.score - a.score)
        .map(({ i }) => i);

    const negativeIndices = tokenScores
        .map(([, score], i) => ({ i, score }))
        .filter(({ score }) => score <= negThreshold)
        .sort((a, b) => a.score - b.score)
        .map(({ i }) => i);

    const positiveRankByIndex: Record<number, number> = {};
    const negativeRankByIndex: Record<number, number> = {};
    positiveIndices.forEach((idx, rank) => { positiveRankByIndex[idx] = rank + 1; });
    negativeIndices.forEach((idx, rank) => { negativeRankByIndex[idx] = rank + 1; });

    return { positiveRankByIndex, negativeRankByIndex };
}

function classifyBucket(score: number): "token-positive" | "token-negative" | "token-neutral" {
    if (score >= POS_THRESHOLD) return "token-positive";
    if (score <= NEG_THRESHOLD) return "token-negative";
    return "token-neutral";
}

function buildDataAttrs(index: number, score: number, ranks: RankMaps): Record<string, string | number> {
    const attrs: Record<string, string | number> = { "data-score": score.toFixed(2) };
    if (ranks.positiveRankByIndex[index]) attrs["data-rank-positive"] = ranks.positiveRankByIndex[index];
    if (ranks.negativeRankByIndex[index]) attrs["data-rank-negative"] = ranks.negativeRankByIndex[index];
    return attrs;
}

export function TokenMultilineText({ tokenScoresList, numLines = 1, paddingPx = 4, onHover, className }: TokenMultilineTextProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const { maxAbsScore } = useColorScale();

    const isFreeFlow = numLines === 0;

    // Free-flow mode: render sequences inline with a small spacer between them
    if (isFreeFlow) {
        return (
            <div className={"whitespace-wrap text-neutral-900 dark:text-neutral-100 " + (className ?? "")}>
                {tokenScoresList.map((tokenScores, seqIdx) => {
                    const ranks = computeRankMaps(tokenScores, POS_THRESHOLD, NEG_THRESHOLD);
                    return (
                        <span key={seqIdx}>
                            {tokenScores.map(([tok, score], i) => {
                                const bucket = classifyBucket(score);
                                const attrs = buildDataAttrs(i, score, ranks);
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
                            {seqIdx < tokenScoresList.length - 1 ? <span className="px-1" /> : null}
                        </span>
                    );
                })}
            </div>
        );
    }

    // Multiline (wrapped) mode: stack each sequence vertically, each with its own wrapping layout
    const n = Math.max(1, tokenScoresList.length);
    return (
        <div className={"overflow-x-auto whitespace-nowrap flex flex-col " + (className ?? "")}>
            {tokenScoresList.map((tokenScores, seqIdx) => {
                const { containerRef, lines, bgByIndex } = useTokenLayout(tokenScores, numLines, paddingPx);
                const ranks = computeRankMaps(tokenScores, POS_THRESHOLD, NEG_THRESHOLD);
                return (
                    <div key={seqIdx} ref={containerRef}>
                        {lines.map((line, lineIdx) => (
                            <div key={lineIdx}>
                                {line.map(({ index }) => {
                                    const [tok, score] = tokenScores[index];
                                    const attrs = buildDataAttrs(index, score, ranks);
                                    return (
                                        <span
                                            key={index}
                                            className="inline-block align-top"
                                            style={{ backgroundColor: bgByIndex[index], paddingRight: `${paddingPx}px`, paddingLeft: `${paddingPx}px` }}
                                            onMouseEnter={() => onHover?.(index, tok, score, seqIdx)}
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
            })}
        </div>
    );
}