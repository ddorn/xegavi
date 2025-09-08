"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, ReferenceLine, Label, Area } from "recharts";
import type { RoundModelWithBest } from "@/lib/barRace";

export interface ModelHistoryChartProps {
  rounds: RoundModelWithBest[];
  roundIndex: number;
  height?: number;
  maxLabels?: number; // number of lanes for improvement labels
  onRoundChange?: (index: number) => void;
}

export function ModelHistoryChart({ rounds, roundIndex, height = 140, maxLabels = 6, onRoundChange }: ModelHistoryChartProps) {
  const isDark = useTheme().theme === "dark";

  const color = rounds[0]?.color ?? "#3b82f6";

  const data = useMemo(() => rounds.map((r, i) => ({ round: i, score: r.score, best: r.bestScore })), [rounds]);

  // Global best index = best at final round
  const globalBestIndex = useMemo(() => {
    if (!rounds.length) return 0;
    return rounds[rounds.length - 1].bestRoundIndex;
  }, [rounds]);

  // Improvement events: points where running best improves (also include round 0 always)
  const improvements = useMemo(() => {
    const events: Array<{ round: number; delta: number; move: string; }> = [];
    if (rounds.length > 0) {
      events.push({ round: 0, delta: 0, move: rounds[0].bestMove });
    }
    for (let i = 1; i < rounds.length; i++) {
      const prev = rounds[i - 1];
      const cur = rounds[i];
      const improved = cur.bestRoundIndex !== prev.bestRoundIndex && cur.bestScore > prev.bestScore;
      if (improved) {
        const delta = cur.bestScore - prev.bestScore;
        events.push({ round: i, delta, move: cur.bestMove });
      }
    }
    return events;
  }, [rounds]);

  // Keep up to maxLabels highest-delta improvements, always include round 0 and global best; display in chronological order
  const displayImprovements = useMemo(() => {
    const mustHave = new Set<number>();
    if (rounds.length > 0) mustHave.add(0);
    mustHave.add(globalBestIndex);

    const sortedByDelta = [...improvements].sort((a, b) => b.delta - a.delta);

    const picked: Array<{ round: number; delta: number; move: string; }> = [];
    for (const ev of sortedByDelta) {
      if (picked.length >= maxLabels) break;
      if (mustHave.has(ev.round) || picked.length < maxLabels) {
        if (!picked.some(p => p.round === ev.round)) picked.push(ev);
      }
    }

    for (const r of mustHave) {
      if (!picked.some(p => p.round === r)) {
        const ev = improvements.find(e => e.round === r);
        if (ev) picked.push(ev);
      }
    }

    picked.sort((a, b) => a.round - b.round);
    return picked;
  }, [improvements, maxLabels, globalBestIndex, rounds.length]);

  // Layout measurements for connectors/labels below the chart
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const LABEL_ROW_HEIGHT = 26; // px
  const ROW_GAP = 4; // px
  const CONNECTOR_HEADROOM = 6; // px extend connectors above first row for visibility
  const lanes = displayImprovements.length; // one lane per label
  const labelBandHeight = lanes * LABEL_ROW_HEIGHT + Math.max(0, lanes - 1) * ROW_GAP;

  // Keep XAxis memoized to avoid tick blinking on updates
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

  if (!rounds.length) return null;

  // Chart margins
  const MARGINS = { top: 22, right: 8, bottom: 10, left: 8 } as const; // small bottom gap for axis only
  const innerWidth = Math.max(0, containerWidth - MARGINS.left - MARGINS.right);
  const denom = Math.max(1, rounds.length - 1);
  const xToPx = (round: number) => MARGINS.left + (round / denom) * innerWidth;
  const lineColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  // Color helpers (for potential future solid tints)
  const colorRgb = useMemo(() => {
    const hex = color.startsWith("#") ? color.slice(1) : color;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }, [color]);
  const rgba = (a: number) => `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, ${a})`;

  return (
    <div ref={containerRef} style={{ width: "100%", height: height + labelBandHeight + CONNECTOR_HEADROOM, position: "relative", color: "currentColor" }}>
      {/* Chart area in a fixed-height wrapper so labels attach flush below */}
      <div style={{ height }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: MARGINS.top, right: MARGINS.right, bottom: MARGINS.bottom, left: MARGINS.left }}
            onClick={(state) => {
              const label = (state)?.activeLabel;
              if (typeof label === "number") onRoundChange?.(label);
            }}
          >
            {MemoizedXAxis}
            <YAxis hide domain={["auto", "auto"]} />

            {/* Running-best area and line (now visible under ComposedChart) */}
            <Area
              type="monotone"
              dataKey="best"
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={0.16}
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

            {/* Current score line */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="currentColor"
              strokeWidth={2}
              dot={{ r: 3, stroke: "transparent", fill: "transparent" }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />

            {/* Trophy only at global best (no duplicate solid line) */}
            <ReferenceLine x={globalBestIndex} stroke="currentColor" strokeDasharray="4 4" opacity={0.9}>
              <Label value="🏆" position="top" />
            </ReferenceLine>

            {/* Vertical markers for improvements (exclude global best to avoid double lines) */}
            {displayImprovements.filter(ev => ev.round !== globalBestIndex).map((ev, i) => (
              <ReferenceLine key={`impr-${i}`} x={ev.round} stroke="currentColor" opacity={0.28} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Label band below the plot; appears above connectors so text stays legible */}
      {lanes > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: labelBandHeight, zIndex: 2 }}>
          {/* Connectors behind boxes, extend slightly above first row */}
          <div style={{ position: "absolute", left: 0, right: 0, top: -CONNECTOR_HEADROOM, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
            {displayImprovements.map((ev, idx) => {
              const x = xToPx(ev.round);
              const y2 = idx * (LABEL_ROW_HEIGHT + ROW_GAP) + LABEL_ROW_HEIGHT / 2 + CONNECTOR_HEADROOM;
              return (
                <div key={`conn-${idx}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: y2, backgroundColor: lineColor }} />
              );
            })}
          </div>

          {/* Text rows (zIndex 1) */}
          <div className="grid grid-cols-1" style={{ gridAutoRows: `${LABEL_ROW_HEIGHT}px`, rowGap: ROW_GAP, position: "relative", zIndex: 1 }}>
            {displayImprovements.map((ev, idx) => {
              const x = xToPx(ev.round);
              const rightSide = x > (MARGINS.left + innerWidth / 2);
              const availableLeft = x - MARGINS.left - 16;
              const availableRight = MARGINS.left + innerWidth - x - 16;
              const pillMax = Math.max(120, Math.floor((rightSide ? availableLeft : availableRight)));
              const bg = isDark ? "#0b0f14" : "#ffffff";
              const border = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)";
              return (
                <div key={`lbl-${idx}`} className="relative flex items-center" style={{ zIndex: 1 }}>
                  {/* Elbow and dot anchored at marker position; render under pill by stacking order */}
                  {rightSide ? (
                    <>
                      <div style={{ position: "absolute", left: x - 12, top: "50%", transform: "translateY(-50%)", height: 1, width: 12, backgroundColor: lineColor, pointerEvents: "none", zIndex: 0 }} />
                      <div style={{ position: "absolute", left: x, top: "50%", transform: "translate(-2px, -50%)", width: 4, height: 4, borderRadius: 9999, backgroundColor: lineColor, pointerEvents: "none", zIndex: 0 }} />
                    </>
                  ) : (
                    <>
                      <div style={{ position: "absolute", left: x, top: "50%", transform: "translateY(-50%)", height: 1, width: 12, backgroundColor: lineColor, pointerEvents: "none", zIndex: 0 }} />
                      <div style={{ position: "absolute", left: x, top: "50%", transform: "translate(-2px, -50%)", width: 4, height: 4, borderRadius: 9999, backgroundColor: lineColor, pointerEvents: "none", zIndex: 0 }} />
                    </>
                  )}

                  {/* Auto-width callout pill; right align when on right; solid backgrounds */}
                  <div className="text-xs opacity-90 rounded px-2 py-1 border" style={{
                    position: "absolute",
                    left: rightSide ? undefined : x + 12,
                    right: rightSide ? (containerWidth - x + 12) : undefined,
                    maxWidth: pillMax,
                    backgroundColor: bg,
                    borderColor: border,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    <span className="tabular-nums" style={{ opacity: 0.7 }}>Round {ev.round + 1}</span>
                    <span className="mx-1" style={{ opacity: 0.5 }}>·</span>
                    <span className="tabular-nums" style={{ opacity: 0.9 }}>Δ+{ev.delta.toFixed(1)}</span>
                    <span className="mx-2" style={{ opacity: 0.5 }}>—</span>
                    {ev.move}
                  </div>

                  {/* Spacer block so row height is preserved */}
                  <div style={{ height: LABEL_ROW_HEIGHT, width: "100%" }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}