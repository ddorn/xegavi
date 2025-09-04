"use client";

import React from "react";
import { TokenMultilineText } from "@/components/TokenMultilineText";
import { RoundModelWithBest } from "@/lib/barRace";
import { ModelHistoryChart } from "@/components/ModelHistoryChart";

export interface ModelRoundDetailsProps {
  item: RoundModelWithBest;
  currentRoundIndex: number;
  history: number[];
  onRoundChange?: (index: number) => void;
}

export const ModelRoundDetails = React.memo(function ModelRoundDetails({ item, currentRoundIndex, history, onRoundChange }: ModelRoundDetailsProps) {
  if (!item) return null;
  const companyColor = item.color;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.logoSrc ? <img src={item.logoSrc} alt={`${item.niceModel ?? item.model} logo`} width={36} height={36} style={{ width: 36, height: 36 }} /> : null}
        <div className="font-semibold">{item.niceModel ?? item.model}</div>
      </div>

      <div style={{ color: companyColor }}>
        <ModelHistoryChart history={history} roundIndex={currentRoundIndex} onRoundChange={onRoundChange} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-bold">📍 Current</span>
        <span>Score {item.score.toFixed(2)}</span>
      </div>
      <div className="text-sm whitespace-nowrap text-ellipsis overflow-hidden">
        {item.move}
      </div>
      <TokenMultilineText tokenScores={item.token_scores} numLines={0} />

      <div className="flex items-baseline gap-2 mt-2">
        <span className="font-bold">🏆 Best so far</span>
        <span>Score {item.bestScore.toFixed(2)}</span>
        <span>Round {item.bestRoundIndex + 1}</span>
      </div>
      <div className="text-sm whitespace-nowrap text-ellipsis overflow-hidden">
        {item.bestMove}
      </div>
      <TokenMultilineText tokenScores={item.bestTokenScores} numLines={0} />
    </div>
  );
});