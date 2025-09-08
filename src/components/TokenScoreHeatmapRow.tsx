"use client";

import React, { useMemo } from "react";
import type { TokenScores, TokenScoresList } from "@/lib/types";
import { useTokenLayout } from "@/hooks/useTokenLayout";

export interface TokenScoreHeatmapRowProps {
  tokenScoresList: TokenScoresList;
  numLines?: number;
  paddingPx?: number;
  onHover?: (tokenIdx: number, token: string, score: number, seqIdx?: number) => void;
}

function SingleSeqRow({ tokenScores, numLines = 1, paddingPx = 4, onHover }: { tokenScores: TokenScores; numLines?: number; paddingPx?: number; onHover?: (tokenIdx: number, token: string, score: number) => void; }) {
  const { containerRef, lines, bgByIndex } = useTokenLayout(tokenScores, numLines, paddingPx);

  const numRenderedLines = lines.length;
  const lineHeightPct = numRenderedLines > 0 ? 100 / numRenderedLines : 100;

  return (
    <div ref={containerRef} className="h-full">
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="overflow-hidden" style={{ height: `${lineHeightPct}%` }}>
          {line.map(({ index, widthPct }) => {
            return (
              <span
                key={index}
                className="inline-block h-full align-top"
                style={{ width: `${widthPct}%`, backgroundColor: bgByIndex[index] }}
                onMouseEnter={() => {
                  const [tok, score] = tokenScores[index];
                  onHover?.(index, tok, score);
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function TokenScoreHeatmapRow({ tokenScoresList, numLines = 1, paddingPx = 4, onHover }: TokenScoreHeatmapRowProps) {
  const n = Math.max(1, tokenScoresList.length);
  return (
    <div className="h-full">
      {tokenScoresList.map((ts, i) => (
        <div key={i} className="overflow-hidden" style={{ height: `${100 / n}%` }}>
          <SingleSeqRow tokenScores={ts} numLines={numLines} paddingPx={paddingPx} onHover={(idx, tok, score) => onHover?.(idx, tok, score, i)} />
        </div>
      ))}
    </div>
  );
}