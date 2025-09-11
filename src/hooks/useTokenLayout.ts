"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TokenScores } from "@/lib/types";
import { useTheme } from "next-themes";
import { useColorScale } from "@/components/ColorScaleContext";
import { tokenScoreToColor } from "@/lib/colors";
import { computeMultilineTokenLayout } from "@/lib/textLayout";

export function useTokenLayout(tokenScores: TokenScores, numLines: number = 1, paddingPx: number = 4) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { maxAbsScore } = useColorScale();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fontString, setFontString] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`.trim();
    setFontString(font);
  }, [resolvedTheme]);

  const measure = useMemo(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx && fontString) {
      ctx.font = fontString;
    }
    return (token: string) => {
      if (!ctx) return token.length + paddingPx;
      return ctx.measureText(token).width + paddingPx;
    };
  }, [fontString, paddingPx]);

  const tokens = useMemo(() => tokenScores.map(([tok]) => tok), [tokenScores]);
  const lines = useMemo(() => computeMultilineTokenLayout(tokens, numLines, measure), [tokens, numLines, measure]);

  const bgByIndex = useMemo(() => tokenScores.map(([, score]) => tokenScoreToColor(score, isDark, maxAbsScore)), [tokenScores, isDark, maxAbsScore]);

  return { containerRef, lines, tokens, bgByIndex };
}