"use client";

import React, { useMemo, useState } from "react";
import type { RoundModel } from "@/lib/types";
import { TokenScoreHeatmapRow } from "@/components/TokenScoreHeatmapRow";

export interface TokenScoreHeatmapProps {
  rounds: RoundModel[];
  rowHeight?: number;
}

function buildRowAnnotations(rounds: RoundModel[]): string[] {
  const withIdx = rounds.map((r, i) => ({ i, s: r.score }));
  withIdx.sort((a, b) => b.s - a.s);

  return rounds.map((_, idx) => {
    const rank = withIdx.findIndex(item => item.i === idx);
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    if (idx === 0) return "first";
    if (idx === rounds.length - 1) return "last";
    return "";
  });
}

export function TokenScoreHeatmap({ rounds, rowHeight = 8 }: TokenScoreHeatmapProps) {
  const annotations = useMemo(() => buildRowAnnotations(rounds), [rounds]);

  const [hover, setHover] = useState<{ roundIdx: number; tokenIdx: number; token: string; score: number } | null>(null);

  if (!rounds.length) return null;

  return (
    <div className="flex flex-col gap-1" onMouseLeave={() => setHover(null)}>
      <div className="flex items-stretch gap-2">
        {/* Left label column */}
        <div className="flex flex-col gap-px w-10">
          {annotations.map((label, idx) => (
            <div key={idx} className="flex items-center justify-end text-xs opacity-80" style={{ height: rowHeight }}>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Right heatmap rows */}
        <div className="flex-1 flex flex-col gap-px">
          {rounds.map((r, roundIdx) => (
            <div key={roundIdx} style={{ height: rowHeight }}>
              <TokenScoreHeatmapRow
                tokenScores={r.token_scores}
                onHover={(tokenIdx, token, score) => setHover({ roundIdx, tokenIdx, token, score })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs opacity-80 min-h-4">
        {hover ? (
          <span>
            Round {hover.roundIdx + 1} · token "{hover.token}" · score {hover.score.toFixed(3)}
          </span>
        ) : null}
      </div>
    </div>
  );
}