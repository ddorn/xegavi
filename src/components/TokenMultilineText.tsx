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

// Shared renderer for a single token span across modes
function renderTokenSpan(params: {
    index: number;
    token: string;
    score: number;
    seqIdx: number;
    ranks: RankMaps;
    paddingPx: number;
    onHover?: (tokenIdx: number, token: string, score: number, seqIdx: number) => void;
    getScoreColor: (score: number) => string;
}) {
    const { index, token, score, seqIdx, ranks, paddingPx, onHover, getScoreColor } = params;
    const bucket = classifyBucket(score);
    const attrs = buildDataAttrs(index, score, ranks);
    const bg = getScoreColor(score);
    return (
        <span
            key={index}
            className={"inline-block align-top " + bucket}
            style={{ backgroundColor: bg, paddingRight: `${paddingPx}px`, paddingLeft: `${paddingPx}px` }}
            onMouseEnter={() => onHover?.(index, token, score, seqIdx)}
            title={`${token} (${score.toFixed(2)})`}
            {...attrs}
        >
            {token}
        </span>
    );
}

function TokenSequenceWrapped({ tokenScores, seqIdx, numLines, paddingPx, onHover, getScoreColor }: { tokenScores: TokenScores; seqIdx: number; numLines: number; paddingPx: number; onHover?: (tokenIdx: number, token: string, score: number, seqIdx: number) => void; getScoreColor: (score: number) => string; }) {
    const { containerRef, lines } = useTokenLayout(tokenScores, numLines, paddingPx);
    const ranks = computeRankMaps(tokenScores, POS_THRESHOLD, NEG_THRESHOLD);
    return (
        <div ref={containerRef}>
            {lines.map((line, lineIdx) => (
                <div key={lineIdx}>
                    {line.map(({ index }) => {
                        const [tok, score] = tokenScores[index];
                        return renderTokenSpan({
                            index,
                            token: tok,
                            score,
                            seqIdx,
                            ranks,
                            paddingPx,
                            onHover,
                            getScoreColor,
                        });
                    })}
                </div>
            ))}
        </div>
    );
}

export function TokenMultilineText({ tokenScoresList, numLines = 1, paddingPx = 4, onHover, className }: TokenMultilineTextProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const { maxAbsScore } = useColorScale();

    const getScoreColor = React.useCallback((score: number) => tokenScoreToColor(score, isDark, maxAbsScore), [isDark, maxAbsScore]);

    const isFreeFlow = numLines === 0;

    // Free-flow mode: render sequences inline with a small spacer between them
    if (isFreeFlow) {
        return (
            <div className={"whitespace-wrap text-neutral-900 dark:text-neutral-100 " + (className ?? "")}>
                {tokenScoresList.map((tokenScores, seqIdx) => {
                    const ranks = computeRankMaps(tokenScores, POS_THRESHOLD, NEG_THRESHOLD);
                    return (
                        <span key={seqIdx}>
                            {tokenScores.map(([tok, score], i) =>
                                renderTokenSpan({
                                    index: i,
                                    token: tok,
                                    score,
                                    seqIdx,
                                    ranks,
                                    paddingPx,
                                    onHover,
                                    getScoreColor,
                                })
                            )}
                            {seqIdx < tokenScoresList.length - 1 ? <span className="px-1" /> : null}
                        </span>
                    );
                })}
            </div>
        );
    }

    // Multiline (wrapped) mode: stack each sequence vertically, each with its own wrapping layout
    return (
        <div className={"overflow-x-auto whitespace-nowrap flex flex-col " + (className ?? "")}>
            {tokenScoresList.map((tokenScores, seqIdx) => (
                <TokenSequenceWrapped
                    key={seqIdx}
                    tokenScores={tokenScores}
                    seqIdx={seqIdx}
                    numLines={numLines}
                    paddingPx={paddingPx}
                    onHover={onHover}
                    getScoreColor={getScoreColor}
                />
            ))}
        </div>
    );
}