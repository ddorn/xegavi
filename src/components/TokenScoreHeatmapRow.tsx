"use client";

import React, { useMemo } from "react";
import type { TokenScores } from "@/lib/types";
import { useTokenLayout } from "@/hooks/useTokenLayout";

export interface TokenScoreHeatmapRowProps {
  tokenScores: TokenScores;
  numLines?: number;
  paddingPx?: number;
  onHover?: (tokenIdx: number, token: string, score: number) => void;
}

export function TokenScoreHeatmapRow({ tokenScores, numLines = 1, paddingPx = 4, onHover }: TokenScoreHeatmapRowProps) {
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