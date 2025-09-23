"use client";

import { useMemo, type ReactNode } from "react";
import type { BarRaceFrame } from "@/lib/barRace";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

export interface BarRaceProps {
  frames: BarRaceFrame[];
  round: number;
  barHeight?: number;
  transitionDurationSec?: number;
  onSelectedIdChange?: (id: string | null, round: number) => void;
  showHeatmap?: boolean;
  selectedId?: string | null;
  heatmapLines?: number;
  showDescription?: "none" | "left" | "right";
}

const NEGATIVE_WIDTH_PCT = 30;

/**
 * A BarRace component that supports positive and negative values.
 *
 * The layout adjusts based on the data for the current frame:
 * - Positive-only: Bars grow left-to-right from a zero-axis at 0%.
 * - Negative-only: Bars grow right-to-left from a zero-axis at 100%.
 * - Mixed: A zero-axis is established at NEGATIVE_WIDTH_PCT (e.g., 30%).
 *   Negative bars grow right-to-left within the 0-30% space.
 *   Positive bars grow left-to-right within the 30-100% space.
 *
 * This component calculates the layout (`widthPct`, `xZeroPct`, `flipped`) and passes
 * it to individual `Bar` components for rendering.
 */
export function BarRace({ frames, round, barHeight = 24, transitionDurationSec = 0.6, onSelectedIdChange, showHeatmap = false, selectedId, heatmapLines = 1, showDescription = "none" }: BarRaceProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nRounds = frames.length;
  const maxRound = Math.max(0, nRounds - 1);
  const safeRound = Math.min(Math.max(0, round), maxRound);

  // Emulate previous gap-4 between rows (Tailwind gap-4 = 1rem ≈ 16px)
  const rowGapPx = barHeight / 3;
  const rowSlotHeight = barHeight + rowGapPx;

  const { currentFrameItems, idsSortedByValue, maxValue, minValue } = useMemo(() => {
    const frame = frames[safeRound] ?? [];
    const arr = [...frame];
    arr.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
    const idsSortedByValue = arr.map((it) => it.id);
    const values = arr.map((it) => it.value);
    const minValue = values.reduce((m, it) => Math.min(m, it), 0);
    const maxValue = values.reduce((m, it) => Math.max(m, it), 0);
    const currentFrameItems = new Map(frame.map((it) => [it.id, it]));
    return { currentFrameItems, idsSortedByValue, maxValue, minValue };
  }, [frames, safeRound]);

  const numRows = idsSortedByValue.length;
  const containerHeight = Math.max(0, numRows * barHeight + Math.max(0, numRows - 1) * rowGapPx);

  return (
    <div
      className="w-full"
      onClick={() => {
        onSelectedIdChange?.(null, safeRound);
      }}
    >
      <div
        className="relative w-full"
        style={{ height: containerHeight }}
      >
        {idsSortedByValue.map((id) => {
          const it = currentFrameItems.get(id)!;
          const rank = idsSortedByValue.indexOf(id);
          const y = rank * rowSlotHeight;

          let widthPct: number;
          let xZeroPct: number;
          let flipped: boolean;

          const hasNegative = minValue < 0;
          const hasPositive = maxValue > 0;

          if (hasNegative && hasPositive) { // Mixed mode
            const totalRange = maxValue - minValue;
            const negativeProportion = -minValue / totalRange;
            const desiredNegativeWidthPct = negativeProportion * 100;
            xZeroPct = Math.min(desiredNegativeWidthPct, NEGATIVE_WIDTH_PCT);

            if (it.value >= 0) {
              flipped = false;
              widthPct = maxValue > 0 ? (it.value / maxValue) * (100 - xZeroPct) : 0;
            } else {
              flipped = true;
              widthPct = minValue < 0 ? (it.value / minValue) * xZeroPct : 0;
            }
          } else if (hasNegative) { // Negative only
            flipped = true;
            xZeroPct = 100;
            widthPct = minValue < 0 ? (it.value / minValue) * 100 : 0;
          } else { // Positive only
            flipped = false;
            xZeroPct = 0;
            widthPct = maxValue > 0 ? (it.value / maxValue) * 100 : 0;
          }

          const isSelected = id === selectedId;

          return (
            <motion.div
              key={id}
              initial={{ y }}
              animate={{ y }}
              transition={{ duration: transitionDurationSec, ease: "easeInOut" }}
              className="absolute left-0 right-0 will-change-transform"
              style={{ height: barHeight }}
            >
              <div
                className="relative cursor-pointer"
                style={{ height: barHeight }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectedIdChange?.(id, safeRound);
                }}
              >
                <Bar
                  item={it}
                  widthPct={widthPct}
                  xZeroPct={xZeroPct}
                  flipped={flipped}
                  barHeight={barHeight}
                  transitionDurationSec={transitionDurationSec}
                  showDescription={showDescription}
                  showHeatmap={showHeatmap}
                  heatmapLines={heatmapLines}
                />
                {isSelected && (
                  <div className="pointer-events-none absolute top-0 left-0 h-full w-full ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-black" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}