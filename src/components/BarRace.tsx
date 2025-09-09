"use client";

import { useMemo, type ReactNode } from "react";
import type { BarRaceFrame } from "@/lib/barRace";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { motion } from "motion/react";
import { TokenScoreHeatmapRow } from "@/components/TokenScoreHeatmapRow";
import type { HeatmapMode, TokenScoresList } from "@/lib/types";
import { useTheme } from "next-themes";

export interface BarRaceProps {
  frames: BarRaceFrame[];
  round: number;
  barHeight?: number;
  transitionDurationSec?: number;
  onSelectedIdChange?: (id: string | null, round: number) => void;
  heatmapMode?: HeatmapMode;
  selectedId?: string | null;
  heatmapLines?: number;
  displayDescription?: boolean;
  moveAlignment?: "left" | "right";
}

const PREFIX_WIDTH_PCT = 30;
const OVERLAY_MARGIN_EM = 3; // reserve ~2em at the right of the common overlay

function HeatmapPrefix({ tokenScoresList, barHeight, widthPct = PREFIX_WIDTH_PCT, numLines = 1 }: { tokenScoresList: TokenScoresList; barHeight: number; widthPct?: number; numLines?: number; }) {
  return (
    <div className="shrink-0" style={{ width: `${widthPct}%`, height: barHeight }}>
      <TokenScoreHeatmapRow tokenScoresList={tokenScoresList} numLines={numLines} />
    </div>
  );
}

function HeatmapOverlay({ tokenScoresList, numLines = 1 }: { tokenScoresList: TokenScoresList; numLines?: number; }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <TokenScoreHeatmapRow tokenScoresList={tokenScoresList} numLines={numLines} />
    </div>
  );
}

function HeatmapFooter({ tokenScoresList, height = 8, numLines = 1 }: { tokenScoresList: TokenScoresList; height?: number; numLines?: number; }) {
  return (
    <div className="absolute left-0 right-0 bottom-0" style={{ height }}>
      <TokenScoreHeatmapRow tokenScoresList={tokenScoresList} numLines={numLines} />
    </div>
  );
}

export function BarRace({ frames, round, barHeight = 24, transitionDurationSec = 0.6, onSelectedIdChange, heatmapMode = "none", selectedId, heatmapLines = 1, displayDescription = false, moveAlignment = "left" }: BarRaceProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nRounds = frames.length;
  const maxRound = Math.max(0, nRounds - 1);
  const safeRound = Math.min(Math.max(0, round), maxRound);

  // Emulate previous gap-4 between rows (Tailwind gap-4 = 1rem ≈ 16px)
  const rowGapPx = barHeight / 3;
  const rowSlotHeight = barHeight + rowGapPx;

  const { currentFrameItems, idsSortedByValue, maxValue } = useMemo(() => {
    const frame = frames[safeRound] ?? [];
    const arr = [...frame];
    arr.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
    const idsSortedByValue = arr.map((it) => it.id);
    const maxValue = arr.reduce((m, it) => Math.max(m, it.value), 0);
    const currentFrameItems = new Map(frame.map((it) => [it.id, it]));
    return { currentFrameItems, idsSortedByValue, maxValue };
  }, [frames, safeRound, nRounds]);

  const numRows = idsSortedByValue.length;
  const containerHeight = Math.max(0, numRows * barHeight + Math.max(0, numRows - 1) * rowGapPx);

  // Compute visible ids and their base fill width percentages
  const visibleIds = useMemo(() => idsSortedByValue, [idsSortedByValue]);
  const baseWidthPctById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const id of visibleIds) {
      const it = currentFrameItems.get(id);
      map[id] = it && maxValue > 0 ? (it.value / maxValue) * 100 : 0;
    }
    return map;
  }, [visibleIds, currentFrameItems, maxValue]);

  // Minimum visible fill percent
  const minFillPct = useMemo(() => {
    const vals = Object.values(baseWidthPctById);
    if (vals.length === 0) return 0;
    return Math.max(0, Math.min(...vals));
  }, [baseWidthPctById]);

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
          const widthPct = maxValue > 0 ? (it.value / maxValue) * 100 : 0;

          const tokenScoresList = it.tokenScoresList ?? null;

          let slots: { prefix?: ReactNode; overlay?: ReactNode; footer?: ReactNode; } | undefined;
          if (tokenScoresList) {
            if (heatmapMode === "prefix") {
              slots = { prefix: <HeatmapPrefix tokenScoresList={tokenScoresList} barHeight={barHeight} numLines={heatmapLines} /> };
            } else if (heatmapMode === "full") {
              slots = { overlay: <HeatmapOverlay tokenScoresList={tokenScoresList} numLines={heatmapLines} /> };
            } else if (heatmapMode === "bottomStripe") {
              slots = { footer: <HeatmapFooter tokenScoresList={tokenScoresList} numLines={heatmapLines} /> };
            } else if (heatmapMode === "overlayAligned") {
              // For each bar, use overlay width relative to its fill so absolute width equals minFillPct of the stage
              const overlayPctOfFill = widthPct > 0 ? Math.min(100, (minFillPct / widthPct) * 100) : 0;
              const overlay = (
                <motion.div
                  className="absolute inset-y-0 left-0 z-0 pointer-events-none"
                  initial={{ width: 0 }}
                  animate={{ width: `${overlayPctOfFill}%` }}
                  transition={{ duration: transitionDurationSec }}
                >
                  <div style={{ width: `calc(100% - ${OVERLAY_MARGIN_EM}em)`, height: "100%" }}>
                    <TokenScoreHeatmapRow tokenScoresList={tokenScoresList} numLines={heatmapLines} />
                  </div>
                </motion.div>
              );
              slots = { overlay };
            }
          }

          const solidBackground = heatmapMode !== "full"; // still show company color for overlayAligned
          const commonText = isDark ? "#fff" : "#000";
          const textColorOverride = heatmapMode === "full" || heatmapMode === "overlayAligned" ? commonText : undefined;

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
                  barHeight={barHeight}
                  logo={<Logo model={it.id} size={barHeight} />}
                  transitionDurationSec={transitionDurationSec}
                  solidBackground={solidBackground}
                  textColorOverride={textColorOverride}
                  slots={slots}
                  displayDescription={displayDescription}
                  moveAlignment={moveAlignment}
                />
                {isSelected && (
                  <div className="pointer-events-none absolute top-0 left-0 h-full w-full ring-2 ring-black dark:ring-white ring-offset-2" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}