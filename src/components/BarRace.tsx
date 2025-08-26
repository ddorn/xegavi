"use client";

import { useMemo, useState } from "react";
import type { BarRaceFrame } from "@/lib/barRace";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";

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

  const { sorted, maxValue } = useMemo(() => {
    const frame = frames[safeRound] ?? [];
    const arr = [...frame];
    arr.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
    const sliced = arr.slice(0, topN);
    const maxVal = sliced.reduce((m, it) => Math.max(m, it.value), 0);
    return { sorted: sliced, maxValue: maxVal };
  }, [frames, safeRound, nRounds, topN]);

  return (
    <div className="w-full flex flex-col gap-4"
      onClick={() => {
        setSelectedId(null);
        onSelectedIdChange?.(null, safeRound);
      }}
    >
      {sorted.map((it) => {
        const widthPct = maxValue > 0 ? (it.value / maxValue) * 100 : 0;
        return (
          <Bar
            key={it.id}
            item={it}
            widthPct={widthPct}
            barHeight={barHeight}
            selected={it.id === selectedId}
            logo={<Logo src={it.iconSrc} size={barHeight} alt={`${it.name} logo`} />}
            onClick={() => {
              setSelectedId(it.id);
              onSelectedIdChange?.(it.id, safeRound);
            }}
            transitionDurationSec={transitionDurationSec}
          />
        );
      })}
    </div>
  );
}