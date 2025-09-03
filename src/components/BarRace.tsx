"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { BarRaceFrame } from "@/lib/barRace";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { motion } from "motion/react";
import { TokenScoreHeatmapRow } from "@/components/TokenScoreHeatmapRow";
import type { HeatmapMode, TokenScores } from "@/lib/types";
import { useTheme } from "next-themes";

export interface BarRaceProps {
  frames: BarRaceFrame[];
  round: number;
  topN?: number;
  barHeight?: number;
  transitionDurationSec?: number;
  onSelectedIdChange?: (id: string | null, round: number) => void;
  heatmapMode?: HeatmapMode;
  getTokenScores?: (id: string, round: number) => TokenScores | null;
}

const PREFIX_WIDTH_PCT = 30;
const OVERLAY_MARGIN_EM = 3; // reserve ~2em at the right of the common overlay

function HeatmapPrefix({ tokenScores, barHeight, widthPct = PREFIX_WIDTH_PCT }: { tokenScores: TokenScores; barHeight: number; widthPct?: number; }) {
  return (
    <div className="shrink-0" style={{ width: `${widthPct}%`, height: barHeight }}>
      <TokenScoreHeatmapRow tokenScores={tokenScores} />
    </div>
  );
}

function HeatmapOverlay({ tokenScores }: { tokenScores: TokenScores; }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <TokenScoreHeatmapRow tokenScores={tokenScores} />
    </div>
  );
}

function HeatmapFooter({ tokenScores, height = 8 }: { tokenScores: TokenScores; height?: number; }) {
  return (
    <div className="absolute left-0 right-0 bottom-0" style={{ height }}>
      <TokenScoreHeatmapRow tokenScores={tokenScores} />
    </div>
  );
}

export function BarRace({ frames, round, topN = 10, barHeight = 36, transitionDurationSec = 0.6, onSelectedIdChange, heatmapMode = "none", getTokenScores }: BarRaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nRounds = frames.length;
  const maxRound = Math.max(0, nRounds - 1);
  const safeRound = Math.min(Math.max(0, round), maxRound);

  // Emulate previous gap-4 between rows (Tailwind gap-4 = 1rem ≈ 16px)
  const rowGapPx = barHeight / 3;
  const rowSlotHeight = barHeight + rowGapPx;


  const { currentFrameItems, idsSortedByName, idsSortedByValue, maxValue } = useMemo(() => {
    const frame = frames[safeRound] ?? [];
    const arr = [...frame];
    arr.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
    const idsSortedByName = arr.map((it) => it.id);
    idsSortedByName.sort((a, b) => a.localeCompare(b));
    const idsSortedByValue = arr.map((it) => it.id);
    const maxValue = arr.reduce((m, it) => Math.max(m, it.value), 0);
    const currentFrameItems = new Map(frame.map((it) => [it.id, it]));
    return { currentFrameItems, idsSortedByName, idsSortedByValue, maxValue };
  }, [frames, safeRound, nRounds, topN]);

  const containerHeight = Math.max(0, topN * barHeight + Math.max(0, topN - 1) * rowGapPx);

  // Compute visible ids and their base fill width percentages
  const visibleIds = useMemo(() => idsSortedByValue.slice(0, topN), [idsSortedByValue, topN]);
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
        setSelectedId(null);
        onSelectedIdChange?.(null, safeRound);
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: containerHeight }}
        data-tour="bar-race"
      >
        {idsSortedByValue.map((id) => {
          const it = currentFrameItems.get(id)!;
          const rank = idsSortedByValue.indexOf(id);
          const isTop = rank < topN;
          const targetIndex = isTop ? rank : topN; // Non-topN placed just below the stage
          const y = targetIndex * rowSlotHeight;
          const widthPct = maxValue > 0 ? (it.value / maxValue) * 100 : 0;

          const tokenScores = getTokenScores?.(id, safeRound) ?? null;

          let slots: { prefix?: ReactNode; overlay?: ReactNode; footer?: ReactNode; } | undefined;
          if (tokenScores) {
            if (heatmapMode === "prefix") {
              slots = { prefix: <HeatmapPrefix tokenScores={tokenScores} barHeight={barHeight} /> };
            } else if (heatmapMode === "full") {
              slots = { overlay: <HeatmapOverlay tokenScores={tokenScores} /> };
            } else if (heatmapMode === "bottomStripe") {
              slots = { footer: <HeatmapFooter tokenScores={tokenScores} /> };
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
                    <TokenScoreHeatmapRow tokenScores={tokenScores} />
                  </div>
                </motion.div>
              );
              slots = { overlay };
            }
          }

          const solidBackground = heatmapMode !== "full"; // still show company color for overlayAligned
          const commonText = isDark ? "#fff" : "#000";
          const textColorOverride = heatmapMode === "full" || heatmapMode === "overlayAligned" ? commonText : undefined;

          return (
            <motion.div
              key={id}
              initial={{ y }}
              animate={{ y }}
              transition={{ duration: transitionDurationSec, ease: "easeInOut" }}
              className="absolute left-0 right-0 will-change-transform"
              style={{ height: barHeight }}
            >
              <Bar
                item={it}
                widthPct={widthPct}
                barHeight={barHeight}
                selected={id === selectedId}
                logo={<Logo src={it.iconSrc} size={barHeight} alt={`${it.name} logo`} />}
                onClick={() => {
                  setSelectedId(id);
                  onSelectedIdChange?.(id, safeRound);
                }}
                transitionDurationSec={transitionDurationSec}
                solidBackground={solidBackground}
                textColorOverride={textColorOverride}
                slots={slots}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}