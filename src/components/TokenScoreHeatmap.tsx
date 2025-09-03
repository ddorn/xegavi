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

  // Outer grid: Heatmap | Chart | (optional) Move
  const outerGridColsClass = showMove
    ? "grid-cols-[minmax(0,_1fr)_max-content_minmax(20rem,_max-content)]"
    : "grid-cols-[minmax(0,_1fr)_max-content]";

  const scores = rounds.map(r => r.score);

  return (
    <div className="" onMouseLeave={() => { setHover(null); setHoveredRoundIdx(null); }}>
      <div className="w-full overflow-x-auto">
        <div className={`grid ${outerGridColsClass} items-stretch gap-x-1 min-w-full relative`}>
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

          {/* Heatmap column: its own rows grid */}
          <div className="min-w-0 relative z-10">
            <div className="grid grid-cols-1 gap-y-px" style={{ gridAutoRows: `${rowHeight}px` }}>
              {rounds.map((r, roundIdx) => (
                <div key={roundIdx} className="min-w-0" onMouseEnter={() => setHoveredRoundIdx(roundIdx)}>
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

          {/* Chart column: fixed-width content so grid uses max-content width */}
          <div className="relative z-10"
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

          {/* Optional move column: its own rows grid */}
          {showMove && (
            <div className="text-xs opacity-80 whitespace-nowrap relative z-10">
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