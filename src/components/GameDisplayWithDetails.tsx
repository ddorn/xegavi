"use client";

import { RoundModelWithBest } from "@/lib/barRace";
import React from "react";
import { Logo } from "@/components/Logo";
import { ModelRoundDetails } from "./ModelRoundDetails";
import { TokenScoreHeatmap } from "./TokenScoreHeatmap";

export interface GameDisplayWithDetailsProps {
  game: RoundModelWithBest[];
  subtitle?: string;
  className?: string;
}

const defaultSubtitle = "Click another model in the leaderboard to see its breakdown";

export function GameDisplayWithDetails({ game, subtitle = defaultSubtitle, className }: GameDisplayWithDetailsProps) {
  if (!game || game.length === 0) return null;

  const last = game[game.length - 1];
  const tries = (last.bestRoundIndex ?? 0) + 1; // 1-based count
  const bestScore = last.bestScore ?? last.score;

  const formatScore = (n: number) => {
    const rounded = Math.round(n);
    return Math.abs(n - rounded) < 1e-6 ? String(rounded) : n.toFixed(1);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="rounded-xl h-14 bg-white" >
          <Logo model={last.model} />
        </div>
        <div className="leading-tight">
          <h2 className="font-black text-2xl sm:text-3xl">
            {last.niceModel} gets to <span className="tabular-nums">{formatScore(bestScore)}</span> points after {" "}
            <span className="tabular-nums">{tries}</span> attempts
          </h2>
          <p className="text-sm opacity-80">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6">
        <TokenScoreHeatmap rounds={game} showMove={true} />
      </div>
    </div>
  );
}