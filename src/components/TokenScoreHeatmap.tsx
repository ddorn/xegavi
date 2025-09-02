"use client";

import React, { useMemo, useState } from "react";
import type { RoundModel } from "@/lib/types";
import { TokenScoreHeatmapRow } from "@/components/TokenScoreHeatmapRow";
import { RoundHistoryVerticalChart } from "@/components/RoundHistoryVerticalChart";

export interface TokenScoreHeatmapProps {
  rounds: RoundModel[];
  rowHeight?: number;
  showMove?: boolean;
  chartColor?: string;
  chartWidth?: number | string;
}

export function TokenScoreHeatmap({ rounds, rowHeight = 16, showMove = false, chartColor = "#3b82f6", chartWidth = 140 }: TokenScoreHeatmapProps) {
  const [hover, setHover] = useState<{ roundIdx: number; tokenIdx: number; token: string; score: number } | null>(null);

  if (!rounds.length) return null;

  // Outer grid: Heatmap | Chart | (optional) Move
  const outerGridColsClass = showMove
    ? "grid-cols-[minmax(0,_1fr)_max-content_minmax(20rem,_max-content)]"
    : "grid-cols-[minmax(0,_1fr)_max-content]";

  const scores = useMemo(() => rounds.map(r => r.score), [rounds]);

  return (
    <div className="" onMouseLeave={() => setHover(null)}>
      <div className="w-full overflow-x-auto">
        <div className={`grid ${outerGridColsClass} items-stretch gap-x-1 min-w-full`}>
          {/* Heatmap column: its own rows grid */}
          <div className="min-w-0">
            <div className="grid grid-cols-1 gap-y-px" style={{ gridAutoRows: `${rowHeight}px` }}>
              {rounds.map((r, roundIdx) => (
                <div key={roundIdx} className="min-w-0">
                  <div className="h-full">
                    <TokenScoreHeatmapRow
                      tokenScores={r.token_scores}
                      onHover={(tokenIdx, token, score) => setHover({ roundIdx, tokenIdx, token, score })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart column: fixed-width content so grid uses max-content width */}
          <div>
            <RoundHistoryVerticalChart scores={scores} rowHeight={rowHeight} width={chartWidth} color={chartColor} />
          </div>

          {/* Optional move column: its own rows grid */}
          {showMove && (
            <div className="text-xs opacity-80 whitespace-nowrap">
              <div className="grid grid-cols-1 gap-y-px" style={{ gridAutoRows: `${rowHeight}px` }}>
                {rounds.map((r, roundIdx) => (
                  <div key={roundIdx} style={{ height: rowHeight }}>
                    {r.move}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm opacity-80 min-h-4">
        {hover ? (
          <span>
            Round {hover.roundIdx + 1} · token &apos;{hover.token}&apos; · score {hover.score.toFixed(3)}
            {!showMove && <><br />Move: {rounds[hover.roundIdx].move}</>}
          </span>
        ) : null}
      </div>
    </div>
  );
}