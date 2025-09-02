"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { tokenScoreToColor } from "@/lib/colors";
import { useColorScale } from "@/components/ColorScaleContext";

export interface TokenScoresBoxProps {
  tokenScores: Array<[string, number]>;
  className?: string;
}

export function TokenScoresBox({ tokenScores, className }: TokenScoresBoxProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { maxAbsScore } = useColorScale();

  return (
    <div className={"whitespace-wrap text-neutral-900 dark:text-neutral-100 " + (className ?? "")}>
      {tokenScores.map(([tok, score], i) => (
        <span
          key={i}
          title={score.toFixed(2)}
          style={{ backgroundColor: tokenScoreToColor(score, isDark, maxAbsScore) }}
          className="px-0.5"
        >
          {tok}
        </span>
      ))}
    </div>
  );
}