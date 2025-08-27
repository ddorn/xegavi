"use client";

import { useMemo, useState } from "react";
import type { BarRaceFrame } from "@/lib/barRace";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { motion } from "motion/react";

export interface BarRaceProps {
  frames: BarRaceFrame[];
  round: number;
  topN?: number;
  barHeight?: number;
  transitionDurationSec?: number;
  onSelectedIdChange?: (id: string | null, round: number) => void;
}

export function BarRace({ frames, round, topN = 10, barHeight = 36, transitionDurationSec = 0.6, onSelectedIdChange }: BarRaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nRounds = frames.length;
  const maxRound = Math.max(0, nRounds - 1);
  const safeRound = Math.min(Math.max(0, round), maxRound);

  // Emulate previous gap-4 between rows (Tailwind gap-4 = 1rem ≈ 16px)
  const rowGapPx = 16;
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
      >
        {idsSortedByValue.map((id) => {
          const it = currentFrameItems.get(id)!;
          const rank = idsSortedByValue.indexOf(id);
          const isTop = rank < topN;
          const targetIndex = isTop ? rank : topN; // Non-topN placed just below the stage
          const y = targetIndex * rowSlotHeight;
          const widthPct = maxValue > 0 ? (it.value / maxValue) * 100 : 0;
          return (
            <motion.div
              key={id}
              initial={{ y }}
              animate={{ y }}
              transition={{ duration: transitionDurationSec, ease: "easeInOut" }}
              className="absolute left-0 right-0 will-change-transform"
              style={{ height: barHeight }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(id);
                onSelectedIdChange?.(id, safeRound);
              }}
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
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}