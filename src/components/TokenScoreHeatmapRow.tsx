"use client";

import React, { useMemo } from "react";
import type { TokenScores } from "@/lib/types";
import { tokenScoreToColor } from "@/lib/colors";
import { useTheme } from "next-themes";
import { useColorScale } from "@/components/ColorScaleContext";

export interface TokenScoreHeatmapRowProps {
  tokenScores: TokenScores;
  onHover?: (tokenIdx: number, token: string, score: number) => void;
}

export function TokenScoreHeatmapRow({ tokenScores, onHover }: TokenScoreHeatmapRowProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { maxAbsScore } = useColorScale();

  const tokenCharLengths = useMemo(() => tokenScores.map(([tok]) => Array.from(tok).length), [tokenScores]);
  const totalChars = useMemo(() => tokenCharLengths.reduce((sum, len) => sum + len, 0), [tokenCharLengths]);

  return (
    <div className="flex h-full">
      {tokenScores.map(([tok, score], tokenIdx) => {
        const tokChars = tokenCharLengths[tokenIdx] ?? Array.from(tok).length;
        const widthPct = totalChars > 0 ? (tokChars / totalChars) * 100 : 0;
        const bg = tokenScoreToColor(score, isDark, maxAbsScore * 0.8);
        return (
          <span
            key={tokenIdx}
            className="block h-full"
            style={{ width: `${widthPct}%`, backgroundColor: bg }}
            onMouseEnter={() => onHover?.(tokenIdx, tok, score)}
          />
        );
      })}
    </div>
  );
}