"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dataset } from "@/lib/types";
import { colorForCompany } from "@/lib/colors";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { BarRaceControls } from "@/components/BarRaceControls";
import { computeBarRaceFrames } from "@/lib/barRace";
import { useThemePreference } from "@/lib/useThemePreference";
import type { RoundModelWithBest } from "@/lib/barRace";

export interface BarRaceProps {
  data: Dataset;
  topN?: number;
  stepMs?: number;
  autoplay?: boolean;
  barHeight?: number;
  onActiveItemChange?: (item: RoundModelWithBest | null) => void;
}

export function BarRace({ data, topN = 10, stepMs = 1000, autoplay = true, barHeight = 36, onActiveItemChange }: BarRaceProps) {
  const [round, setRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const frames = useMemo(() => computeBarRaceFrames(data), [data]);
  const nRounds = frames.length;

  // Basic theme detection via media query (matches website behavior when using Tailwind dark)
  const theme = useThemePreference();

  // Speed control
  const SPEED_STEPS = [0.25, 0.5, 1, 1.5, 2] as const;
  const [speedIndex, setSpeedIndex] = useState(() => SPEED_STEPS.indexOf(1));
  const speed = SPEED_STEPS[speedIndex] ?? 1;
  const cycleSpeed = () => setSpeedIndex((i) => (i + 1) % SPEED_STEPS.length);
  const effectiveStepMs = Math.max(1, Math.round(stepMs / speed));

  useEffect(() => {
    if (!isPlaying || nRounds === 0) return;
    const id = setInterval(() => {
      setRound((r) => (r + 1) % nRounds);
    }, effectiveStepMs);
    return () => clearInterval(id);
  }, [isPlaying, effectiveStepMs, nRounds]);

  const frame = frames[Math.min(round, Math.max(0, nRounds - 1))] ?? {};
  const arr = Object.values(frame);
  arr.sort((a, b) => {
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return a.model.localeCompare(b.model);
  });
  const sorted = arr.slice(0, topN);

  const maxScore = sorted.reduce((m, it) => Math.max(m, it.bestScore), 0);

  const defaultModel = sorted[0]?.model ?? null;
  const activeModel = selectedModel ?? defaultModel;
  const selectedItem = activeModel ? (frame as Record<string, RoundModelWithBest>)[activeModel] : undefined;

  useEffect(() => {
    onActiveItemChange?.(selectedItem ?? null);
  }, [onActiveItemChange, selectedItem]);

  const maxRound = Math.max(0, nRounds - 1);

  return (
    <div className="w-full flex flex-col gap-4"
      onClick={() => setSelectedModel(null)}
    >
      <BarRaceControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        round={round}
        maxRound={maxRound}
        totalRounds={nRounds}
        onSeek={setRound}
        disabled={nRounds === 0}
        speed={speed}
        onCycleSpeed={cycleSpeed}
      />

      {sorted.map((it, idx) => {
        const color = colorForCompany(it.company, theme);
        const widthPct = maxScore > 0 ? (it.bestScore / maxScore) * 100 : 0;
        return (
          <Bar
            key={it.model}
            idx={idx}
            model={it.model}
            niceModel={it.nice_model}
            move={it.bestMove}
            score={it.bestScore}
            widthPct={widthPct}
            color={color}
            barHeight={barHeight}
            logo={<Logo src={it.logo} size={barHeight} alt={`${it.company} logo`} />}
            onClick={() => setSelectedModel(it.model)}
          />
        );
      })}
    </div>
  );
}