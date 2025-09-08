"use client";

import React from "react";

export interface ScoreTooltipProps {
  currentKey?: string; // defaults to 'current'
  bestKey?: string; // defaults to 'best'
}

// Factory returning a tooltip renderer with fixed keys
export function makeScoreTooltip({ currentKey = "current", bestKey = "best" }: ScoreTooltipProps) {
  return function ScoreTooltipRenderer(props: any) {
    const { active, payload, label } = props as {
      active?: boolean;
      payload?: Array<{ dataKey: string; value: number }>;
      label?: number | string;
    };

    if (!active || !payload || payload.length === 0) return null;

    const current = payload.find(p => p.dataKey === currentKey)?.value;
    const best = payload.find(p => p.dataKey === bestKey)?.value;

    const format = (n: number | undefined) => {
      if (typeof n !== "number" || Number.isNaN(n)) return "-";
      const rounded = Math.round(n * 10) / 10;
      return rounded.toFixed(1);
    };

    return (
      <div style={{
        backgroundColor: "white",
        color: "black",
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: 8,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontSize: 12
      }}>
        {label !== undefined && (
          <p style={{ margin: "0 0 4px 0", fontWeight: 700 }}>Round {Number(label) + 1}</p>
        )}
        <p style={{ margin: 0 }}>Score: {format(current)}</p>
        <p style={{ margin: 0 }}>Best: {format(best)}</p>
      </div>
    );
  };
}