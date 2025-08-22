"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dataset, RoundModel, TokenScores } from "@/lib/types";
import { colorForCompany } from "@/lib/colors";
import { Bar } from "@/components/Bar";
import { Logo } from "@/components/Logo";
import { BarRaceControls } from "@/components/BarRaceControls";
import { TokenScoresBox } from "@/components/TokenScoresBox";

export interface BarRaceProps {
  data: Dataset;
  topN?: number;
  stepMs?: number;
  autoplay?: boolean;
  barHeight?: number;
}

export function BarRace({ data, topN = 10, stepMs = 1000, autoplay = true, barHeight = 36 }: BarRaceProps) {
  const [round, setRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const roundsUnstructured = data.rounds;
  const nRounds = roundsUnstructured.length;

  // Basic theme detection via media query (matches website behavior when using Tailwind dark)
  const theme: "light" | "dark" = useMemo(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  useEffect(() => {
    if (!isPlaying || nRounds === 0) return;
    const id = setInterval(() => {
      setRound((r) => (r + 1) % nRounds);
    }, stepMs);
    return () => clearInterval(id);
  }, [isPlaying, stepMs, nRounds]);

  const modelNames = roundsUnstructured[0].map((r) => r.model);

  // It's easier to have a list of dicts rather than a list of lists
  const rounds: Array<Record<string, RoundModel>> = [];
  for (const round of roundsUnstructured) {
    const roundRecord: Record<string, RoundModel> = {};
    for (const model of modelNames) {
      roundRecord[model] = round.find((r) => r.model === model)!;
    }
    rounds.push(roundRecord);
  }

  // For each round i, bestRounds[i][model] is the index of the best score for model in rounds[0..i]
  const bestRounds: Array<Record<string, number>> = [];
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const bestRound: Record<string, number> = {};
    for (const model in round) {
      const score = round[model].score;
      const previousBestIdx = i > 0 ? bestRounds[i - 1][model] : 0;
      const previousBestScore = rounds[previousBestIdx][model].score;
      bestRound[model] = score > previousBestScore ? i : previousBestIdx;
    }
    bestRounds.push(bestRound);
  }

  const frame = rounds[Math.min(round, Math.max(0, nRounds - 1))] ?? {};
  const arr = Object.values(frame);
  arr.sort((a, b) => {
    const aBestScore = rounds[bestRounds[round][a.model]][a.model].score;
    const bBestScore = rounds[bestRounds[round][b.model]][b.model].score;
    if (bBestScore !== aBestScore) return bBestScore - aBestScore;
    return a.model.localeCompare(b.model);
  });
  const sorted = arr.slice(0, topN);

  const maxScore = sorted.reduce((m, it) => Math.max(m, rounds[bestRounds[round][it.model]][it.model].score), 0);

  const defaultModel = sorted[0]?.model ?? null;
  const activeModel = selectedModel ?? defaultModel;
  const selectedItem = activeModel ? frame[activeModel] : undefined;
  const selectedTokens = selectedItem?.token_scores ?? null;

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
      />

      {sorted.map((it, idx) => {
        const bestRoundData = rounds[bestRounds[round][it.model]][it.model];
        const color = colorForCompany(it.company, theme);
        const widthPct = maxScore > 0 ? (bestRoundData.score / maxScore) * 100 : 0;
        return (
          <Bar
            key={it.model}
            idx={idx}
            model={it.model}
            niceModel={it.nice_model}
            move={bestRoundData.move}
            score={bestRoundData.score}
            widthPct={widthPct}
            color={color}
            barHeight={barHeight}
            logo={<Logo src={it.logo} size={barHeight} alt={`${it.company} logo`} />}
            onClick={() => setSelectedModel(it.model)}
          />
        );
      })}

      <TokenScoresBox tokenScores={selectedTokens ?? null} />
    </div>
  );
}