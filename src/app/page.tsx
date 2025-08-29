"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Playback } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import type { AugmentedFrame, BarRaceFrame, RoundModelWithBest } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RaceData } from "@/lib/barRace";
import { BarRaceControls } from "@/components/BarRaceControls";
import { ModelRoundDetails } from "@/components/ModelRoundDetails";
import { TokenScoreHeatmap } from "@/components/TokenScoreHeatmap";
import { ColorScaleProvider } from "@/components/ColorScaleContext";
import type { TokenScores } from "@/lib/types";
import { useDataset } from "@/hooks/useDataset";
import { colorForCompany } from "@/lib/colors";
import { Explainer } from "@/components/Explainer";
import { Coachmark } from "@/components/Coachmark";

export default function Home() {
  const { data, error, onFile } = useDataset();

  const raceData = useMemo(() => (data ? new RaceData(data) : null), [data]);
  const frames = useMemo(() => (raceData ? buildFrames(raceData.augmented) : []), [raceData]);

  const [playbackState, setPlaybackState] = useState<Playback>({ isPlaying: true, round: 0, speed: 1 });
  const handleRoundChange = useCallback((idx: number) => {
    setPlaybackState((s) => ({ ...s, round: idx }));
  }, []);

  // Reset round to 0 state when race data changes
  useEffect(() => {
    setPlaybackState((s) => ({ ...s, round: 0 }));
  }, [raceData]);

  useEffect(() => {
    const n = raceData?.roundsLength ?? 0;
    if (!playbackState.isPlaying || n === 0) return;
    const stepMs = 1000;
    const effective = Math.max(1, Math.round(stepMs / (playbackState.speed || 1)));
    const id = setInterval(() => {
      setPlaybackState((s) => ({ ...s, round: (s.round + 1) % Math.max(1, n) }));
    }, effective);
    return () => clearInterval(id);
  }, [playbackState.isPlaying, playbackState.speed, raceData?.roundsLength]);

  const [leftId, rightIdDefault] = useMemo(() => (raceData ? raceData.finalists() : [undefined, undefined]), [raceData]);

  useEffect(() => {
    setPlaybackState((s) => ({ ...s, round: 0 }));
  }, [data]);

  // Right-column selection logic: follows clicked bar if present; otherwise defaults to second finalist;
  // ensure it differs from left finalist.
  const [clickedId, setClickedId] = useState<string | null>(null);
  const handleSelectedIdChange = useCallback((id: string | null, round: number) => {
    setClickedId(id);
  }, []);

  const rightId = useMemo(() => {
    if (!raceData) return null;
    const fallback = rightIdDefault && rightIdDefault !== leftId ? rightIdDefault : (
      // choose any different id from the last frame
      Object.keys(raceData.augmented[raceData.augmented.length - 1] || {}).find((id) => id !== leftId) || null
    );
    if (clickedId && clickedId !== leftId) return clickedId;
    return fallback;
  }, [clickedId, rightIdDefault, leftId, raceData]);

  const safeRound = useMemo(() => {
    const maxIdx = Math.max(0, (raceData?.augmented.length ?? 0) - 1);
    return Math.min(Math.max(0, playbackState.round), maxIdx);
  }, [playbackState.round, raceData?.augmented.length]);

  const leftItem: RoundModelWithBest | null = leftId && raceData ? raceData.itemAt(leftId, safeRound) : null;
  const rightItem: RoundModelWithBest | null = rightId && raceData ? raceData.itemAt(rightId, safeRound) : null;

  const leftHistory = useMemo(() => (leftId && raceData ? raceData.historyFor(leftId) : [] as number[]), [raceData, leftId]);
  const rightHistory = useMemo(() => (rightId && raceData ? raceData.historyFor(rightId) : [] as number[]), [raceData, rightId]);

  const leftRounds = useMemo(() => (leftId && raceData ? raceData.roundsFor(leftId) : [] as RoundModelWithBest[]), [raceData, leftId]);
  const rightRounds = useMemo(() => (rightId && raceData ? raceData.roundsFor(rightId) : [] as RoundModelWithBest[]), [raceData, rightId]);

  const getTokenScores = useCallback((id: string, round: number): TokenScores | null => {
    return raceData ? raceData.tokenScoresAt(id, round) : null;
  }, [raceData]);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Xent Labs Benchmark Race</h1>
          <div className="flex items-center gap-2">
            {/* <label className="cursor-pointer inline-flex items-center gap-3">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
              <span className="button">Load JSON</span>
            </label> */}
            <ThemeToggle />
          </div>
        </header>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        {!data && (
          <div className="text-sm opacity-75">Load a dataset JSON object: {"{ version, rounds }"}.</div>
        )}

        {raceData && (
          <ColorScaleProvider maxAbsScore={raceData.maxAbsScore * 0.6}>
            <div className="flex flex-col gap-3">
              <Explainer className="mt-6 mb-12" />

              <h2 className="text-3xl font-bold text-center mb-6">Which model is the best?</h2>

              <BarRaceControls
                playback={playbackState}
                maxRound={Math.max(0, raceData.roundsLength - 1)}
                totalRounds={raceData.roundsLength}
                onPlaybackChange={setPlaybackState}
              />

              <div className="border rounded-md p-3">
                <BarRace
                  frames={frames}
                  topN={frames[0].length}
                  barHeight={24}
                  round={playbackState.round}
                  transitionDurationSec={Math.min(1, 1000 / (playbackState.speed || 1)) * 0.8}
                  onSelectedIdChange={handleSelectedIdChange}
                  heatmapMode="prefix"
                  getTokenScores={getTokenScores}
                />
              </div>

              {leftItem && rightItem && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border rounded-md p-3">
                    <ModelRoundDetails
                      item={leftItem}
                      currentRoundIndex={safeRound}
                      history={leftHistory}
                      onRoundChange={handleRoundChange}
                    />
                    <div className="mt-3">
                      <h2 className="text-sm font-semibold mb-2">Per-token scores</h2>
                      <TokenScoreHeatmap rounds={leftRounds} rowHeight={8} />
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <ModelRoundDetails
                      item={rightItem}
                      currentRoundIndex={safeRound}
                      history={rightHistory}
                      onRoundChange={handleRoundChange}
                    />
                    <div className="mt-3">
                      <h2 className="text-sm font-semibold mb-2">Per-token scores</h2>
                      <TokenScoreHeatmap rounds={rightRounds} rowHeight={8} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ColorScaleProvider>
        )}
      </div>
    </div>
  );
}


/** Build presentation frames from augmented data. */
export function buildFrames(augmented: AugmentedFrame[]): BarRaceFrame[] {
  return augmented.map((frame) =>
    Object.values(frame).map((it) => ({
      id: it.model,
      name: it.nice_model ?? it.model,
      description: it.bestMove,
      value: it.bestScore,
      color: colorForCompany(it.company),
      iconSrc: it.logo ?? "",
    }))
  );
}
