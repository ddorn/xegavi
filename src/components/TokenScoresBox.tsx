"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { tokenScoreToColor } from "@/lib/colors";

export interface TokenScoresBoxProps {
  tokenScores: Array<[string, number]>;
}

export function TokenScoresBox({ tokenScores }: TokenScoresBoxProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === "dark";

  if (!mounted) {
  // Avoid SSR/theme mismatch flash
    return (
      <div className="text-sm leading-6 whitespace-pre-wrap">
        {tokenScores.map(([tok], i) => (
          <span key={i} className="px-0.5">
            {tok}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="text-sm leading-6 whitespace-pre-wrap text-neutral-900 dark:text-neutral-100">
      {tokenScores.map(([tok, score], i) => (
        <span
          key={i}
          title={score.toFixed(2)}
          style={{ backgroundColor: tokenScoreToColor(score, isDark) }}
          className="px-0.5"
        >
          {tok}
        </span>
      ))}
    </div>
  );
}