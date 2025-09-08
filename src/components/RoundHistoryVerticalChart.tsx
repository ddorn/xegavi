"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, ReferenceLine, ReferenceDot, Label, Tooltip } from "recharts";
import { makeScoreTooltip } from "@/components/ScoreTooltip";

export interface RoundHistoryVerticalChartProps {
  scores: number[];
  rowHeight: number;
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
}

export function RoundHistoryVerticalChart({ scores, rowHeight, width = 140, height, color = "#3b82f6", className }: RoundHistoryVerticalChartProps) {
  const { data, rankedRounds, xMin, xMax } = useMemo(() => {
    let best = Number.NEGATIVE_INFINITY;
    const d = scores.map((score, idx) => {
      best = Math.max(best, score);
      return {
        y: idx + 1, // 1-based for nicer labeling
        current: score,
        best
      };
    });

    // top 3 rounds by final score (not best-so-far). If ties, earlier rounds first.
    const ranked = scores
      .map((s, i) => ({ round: i + 1, score: s }))
      .sort((a, b) => (b.score - a.score) || (a.round - b.round));

    const minVal = Math.min(0, ...scores);
    const maxVal = Math.max(0, ...scores);

    return { data: d, rankedRounds: ranked, xMin: minVal, xMax: maxVal };
  }, [scores]);

  if (!scores.length) return null;

  // Account for the 1px vertical gaps between rows in the heatmap grid when height is not provided
  const computedHeight = scores.length * rowHeight + Math.max(0, scores.length - 1) * 1;

  const yMin = 0.5;
  const yMax = scores.length + 0.5;
  const yTicks = scores.map((_, i) => i + 1);

  // Medal line segment extents
  const range = Math.max(1e-6, xMax - xMin);
  const segRight = xMax + range * 0; // small padding from the right
  const segLeft  = 0;

  const TooltipRenderer = makeScoreTooltip({ currentKey: "current", bestKey: "best" });

  return (
    <div className={className} style={{ width, height: height ?? computedHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 12, bottom: 0, left: 2 }}
        >
          {/* numeric X so zero reference line shows; clamp to at most min 0 */}
          <XAxis type="number" hide domain={[ (dataMin: number) => Math.min(0, dataMin), "auto" ]} />

          {/* numeric Y with +/- 0.5 padding to center rows */}
          <YAxis
            type="number"
            dataKey="y"
            domain={[yMin, yMax]}
            ticks={yTicks}
            tickLine={false}
            width={20}
            tick={{ fontSize: 10, opacity: 0.8 }}
          />

          <Tooltip content={<TooltipRenderer />} />

          <Area
            type="monotone"
            dataKey="best"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.12}
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="current"
            stroke="currentColor"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="best"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          {/* Medal markers */}
          {/* {rankedRounds.slice(0, 3).map((r, idx) => {
            const emoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
            return (
              <ReferenceLine
                key={idx}
                segment={[ { x: segLeft, y: r.round }, { x: segRight, y: r.round } ]}
                stroke="currentColor"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              >
                <Label value={emoji} position="center" />
              </ReferenceLine>
            );
          })} */}

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}