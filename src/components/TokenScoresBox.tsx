"use client";

import React from "react";

export interface TokenScoresBoxProps {
  tokenScores: Array<[string, number]> | null | undefined;
}

const TOKEN_SCORE_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToCss(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Tailwind-like palette
const RED = [220, 38, 38];      // red-600
const NEUTRAL = [243, 244, 246]; // gray-100 (light neutral)
const GREEN = [22, 163, 74];     // green-600

function scoreToColor(value: number): string {
  const v = clamp(value, -TOKEN_SCORE_MAX, TOKEN_SCORE_MAX);
  if (v >= 0) {
    const t = v / TOKEN_SCORE_MAX;
    return rgbToCss(
      lerp(NEUTRAL[0], GREEN[0], t),
      lerp(NEUTRAL[1], GREEN[1], t),
      lerp(NEUTRAL[2], GREEN[2], t)
    );
  } else {
    const t = (-v) / TOKEN_SCORE_MAX;
    return rgbToCss(
      lerp(NEUTRAL[0], RED[0], t),
      lerp(NEUTRAL[1], RED[1], t),
      lerp(NEUTRAL[2], RED[2], t)
    );
  }
}

export function TokenScoresBox({ tokenScores }: TokenScoresBoxProps) {
  if (!tokenScores) {
    return (
      <div className="text-sm text-neutral-600 dark:text-neutral-300">
        No token breakdown available.
      </div>
    );
  }

  return (
    <div className="text-sm leading-6 border border-neutral-200 dark:border-neutral-800 rounded p-3 whitespace-pre-wrap">
      {tokenScores.map(([tok, score], i) => (
        <span
          key={i}
          title={score.toFixed(2)}
          style={{ backgroundColor: scoreToColor(score), borderRadius: 2 }}
          className="px-0.5"
        >
          {tok}
        </span>
      ))}
    </div>
  );
}