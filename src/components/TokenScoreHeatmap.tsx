"use client";

import React, { useState } from "react";
import type { RoundModel } from "@/lib/types";
import { TokenScoreHeatmapRow } from "@/components/TokenScoreHeatmapRow";
import { RoundHistoryVerticalChart } from "@/components/RoundHistoryVerticalChart";
import { motion } from "motion/react";

export interface TokenScoreHeatmapProps {
  rounds: RoundModel[];
  rowHeight?: number;
  showMove?: boolean;
  chartColor?: string;
  chartWidth?: number | string;
}

export function TokenScoreHeatmap({ rounds, rowHeight = 16, showMove = false, chartColor = "#3b82f6", chartWidth = 140 }: TokenScoreHeatmapProps) {
  const [hover, setHover] = useState<{ roundIdx: number; tokenIdx: number; token: string; score: number } | null>(null);
  const [hoveredRoundIdx, setHoveredRoundIdx] = useState<number | null>(null);

  if (!rounds.length) return null;

  const scores = rounds.map(r => r.score);

  return (
    <div className="" onMouseLeave={() => { setHover(null); setHoveredRoundIdx(null); }}>
      {/* Scroll container wraps a non-wrapping horizontal flex row */}
      <div className="relative overflow-x-auto">
        <div className="flex flex-nowrap items-stretch gap-x-1 min-w-full w-max relative">
          {/* Highlight band spanning all columns */}
          {rounds.length > 0 && (
            <motion.div
              className="pointer-events-none absolute left-0 right-0 bg-blue-100/50 dark:bg-blue-900/30 rounded-sm"
              style={{ top: 0, height: rowHeight }}
              initial={false}
              animate={{ y: (hoveredRoundIdx ?? 0) * (rowHeight + 1), opacity: hoveredRoundIdx === null ? 0 : 1 }}
              transition={{ duration: 0.1 }}
            />
          )}

          {/* Heatmap column: flexible, grows and can shrink */}
          <div className="relative z-10 flex-1 min-w-xs">
            <div className="grid grid-cols-1 gap-y-px" style={{ gridAutoRows: `${rowHeight}px` }}>
              {rounds.map((r, roundIdx) => (
                  <div key={roundIdx} className="" onMouseEnter={() => setHoveredRoundIdx(roundIdx)}>
                    <div className="h-full">
                      <TokenScoreHeatmapRow
                        tokenScores={r.token_scores}
                        onHover={(tokenIdx, token, score) => { setHover({ roundIdx, tokenIdx, token, score }); setHoveredRoundIdx(roundIdx); }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Chart column: fixed-width, does not shrink */}
          <div
            className="relative z-10 shrink-0"
            style={{ width: chartWidth }}
            onMouseMove={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const y = e.clientY - rect.top;
              const pitch = rowHeight + 1; // row height plus 1px grid gap used elsewhere
              const idx = Math.max(0, Math.min(rounds.length - 1, Math.floor(y / pitch)));
              setHoveredRoundIdx(idx);
            }}
            onMouseLeave={() => setHoveredRoundIdx(null)}
          >
            <RoundHistoryVerticalChart scores={scores} rowHeight={rowHeight} width={chartWidth} color={chartColor} />
          </div>

          {/* Optional move column: width is max-content, does not shrink */}
          {showMove && (
            <div className="text-xs opacity-80 whitespace-nowrap relative z-10 shrink-0  w-max">
              <div className="grid grid-cols-1 gap-y-px" style={{ gridAutoRows: `${rowHeight}px` }}>
                {rounds.map((r, roundIdx) => (
                  <div key={roundIdx} style={{ height: rowHeight }} onMouseEnter={() => setHoveredRoundIdx(roundIdx)}>
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