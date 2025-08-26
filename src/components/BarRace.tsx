"use client";

import { useEffect, useMemo, useState } from "react";
import type { BarRaceFrame } from "@/lib/barRace";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { BarRaceControls } from "@/components/BarRaceControls";

export interface BarRaceProps {
  frames: BarRaceFrame[];
  topN?: number;
  stepMs?: number;
  autoplay?: boolean;
  barHeight?: number;
  onSelectedIdChange?: (id: string | null, round: number) => void;
}

export function BarRace({ frames, topN = 10, stepMs = 1000, autoplay = true, barHeight = 36, onSelectedIdChange }: BarRaceProps) {
  const [round, setRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nRounds = frames.length;

  // Speed control value (steps owned by controls)
  const [speed, setSpeed] = useState<number>(1);
  const effectiveStepMs = Math.max(1, Math.round(stepMs / (speed || 1)));

  useEffect(() => {
    if (!isPlaying || nRounds === 0) return;
    const id = setInterval(() => {
      setRound((r) => (r + 1) % nRounds);
    }, effectiveStepMs);
    return () => clearInterval(id);
  }, [isPlaying, effectiveStepMs, nRounds]);

  const { sorted, maxValue } = useMemo(() => {
    const frame = frames[Math.min(round, Math.max(0, nRounds - 1))] ?? [];
    const arr = [...frame];
    arr.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
    const sliced = arr.slice(0, topN);
    const maxVal = sliced.reduce((m, it) => Math.max(m, it.value), 0);
    return { sorted: sliced, maxValue: maxVal };
  }, [frames, round, nRounds, topN]);

  const defaultId = sorted[0]?.id ?? null;
  const activeId = selectedId ?? defaultId;
  const maxRound = Math.max(0, nRounds - 1);

  useEffect(() => {
    onSelectedIdChange?.(activeId ?? null, round);
  }, [onSelectedIdChange, activeId, round]);

  return (
    <div className="w-full flex flex-col gap-4"
      onClick={() => setSelectedId(null)}
    >
      <BarRaceControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        round={round}
        maxRound={maxRound}
        totalRounds={nRounds}
        onSeek={setRound}
        speed={speed}
        onSetSpeed={setSpeed}
      />

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
            onClick={() => setSelectedId(it.id)}
            transitionDurationSec={effectiveStepMs / 1000}
          />
        );
      })}
    </div>
  );
}