"use client";

import { useTheme } from "next-themes";
import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, Label, Tooltip } from "recharts";

export interface ModelHistoryChartProps {
  history: number[];
  roundIndex: number;
  height?: number;
  onRoundChange?: (index: number) => void;
}

export function ModelHistoryChart({ history, roundIndex, height = 140, onRoundChange }: ModelHistoryChartProps) {
  const data = useMemo(() => history.map((score, round) => ({ round, score })), [history]);

  const bestSoFarIndex = useMemo(() => {
    let idx = 0;
    let best = Number.NEGATIVE_INFINITY;
    const end = Math.min(history.length - 1, Math.max(0, roundIndex));
    for (let i = 0; i <= end; i++) {
      const v = history[i];
      if (v > best) {
        best = v;
        idx = i;
      }
    }
    return idx;
  }, [history, roundIndex]);

  if (history.length === 0) return null;

  const isDark = useTheme().theme === "dark";

  // Without this, the XAxis blink evry round update.
  // I can't figure out why, so we memoize it, which works.
  const MemoizedXAxis = useMemo(() => (
    <XAxis
      dataKey="round"
      tickLine={false}
      axisLine={false}
      tick={{ fontSize: 11, fill: isDark ? "white" : "black", opacity: 0.7 }}
      tickFormatter={(r: number | string) => String(Number(r) + 1)}
      allowDecimals={false}
    />
  ), [isDark]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 22, right: 8, bottom: 16, left: 8 }}
          onClick={(state) => {
            const label = (state as any)?.activeLabel;
            if (typeof label === "number") onRoundChange?.(label);
          }}
        >
          {MemoizedXAxis}
          <YAxis hide domain={["auto", "auto"]} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="currentColor"
            strokeWidth={2}
            dot={{ r: 3, stroke: "transparent", fill: "transparent" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <ReferenceLine x={bestSoFarIndex} stroke="currentColor" strokeDasharray="4 4" opacity={0.9}>
            <Label value="🏆" position="top" />
          </ReferenceLine>
          <ReferenceLine x={roundIndex} stroke="currentColor" opacity={0.6}>
            <Label value="📍" position="top" />
          </ReferenceLine>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}