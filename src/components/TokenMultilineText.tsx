"use client";

import React from "react";
import type { TokenScores } from "@/lib/types";
import { useTokenLayout } from "@/hooks/useTokenLayout";
import { tokenScoreToColor } from "@/lib/colors";
import { useTheme } from "next-themes";
import { useColorScale } from "./ColorScaleContext";

export interface TokenMultilineTextProps {
  tokenScores: TokenScores;
  numLines?: number;
  paddingPx?: number;
  onHover?: (tokenIdx: number, token: string, score: number) => void;
}

export function TokenMultilineText({ tokenScores, numLines = 1, paddingPx = 4, onHover }: TokenMultilineTextProps) {
  const { containerRef, lines, bgByIndex } = useTokenLayout(tokenScores, numLines, paddingPx);

  return (
    <div ref={containerRef} className="overflow-x-auto whitespace-nowrap">
      {lines.map((line, lineIdx) => (
        <div key={lineIdx}>
          {line.map(({ index, isLastInLine }) => {
            const [tok, score] = tokenScores[index];
            return (
              <span
                key={index}
                className="inline-block align-top"
                style={{ backgroundColor: bgByIndex[index], paddingRight: `${paddingPx}px` }}
                onMouseEnter={() => onHover?.(index, tok, score)}
                title={tok}
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