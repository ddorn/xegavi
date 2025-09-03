"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Playback } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import type { AugmentedFrame, BarRaceFrame } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RaceData } from "@/lib/barRace";
import { BarRaceControls } from "@/components/BarRaceControls";
import { ColorScaleProvider } from "@/components/ColorScaleContext";
import type { TokenScores } from "@/lib/types";
import { useDataset } from "@/hooks/useDataset";
import { colorForCompany, pickTextColor } from "@/lib/colors";
import { Explainer } from "@/components/Explainer";
import { GameDisplayWithDetails } from "@/components/GameDisplayWithDetails";
import { TokenScoresBox } from "@/components/TokenScoresBox";
import { Logo } from "@/components/Logo";
import TourGuide from "@/components/TourGuide";

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
    setFocusedModelId(raceData?.finalists()[0] ?? null);
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


  const [focusedModelId, setFocusedModelId] = useState<string | null>(null);

  const handleSelectedIdChange = useCallback((id: string | null, round: number) => {
    if (id !== null && id !== focusedModelId) {
      setFocusedModelId(id);
    }
  }, []);


  const safeRound = useMemo(() => {
    const maxIdx = Math.max(0, (raceData?.augmented.length ?? 0) - 1);
    return Math.min(Math.max(0, playbackState.round), maxIdx);
  }, [playbackState.round, raceData?.augmented.length]);

  const leftRounds = focusedModelId && raceData ? raceData.roundsFor(focusedModelId) : [];

  const getTokenScores = useCallback((id: string, round: number): TokenScores | null => {
    return raceData ? raceData.tokenScoresAt(id, round) : null;
  }, [raceData]);

  const explainerRound = focusedModelId && raceData ? raceData.roundsFor(focusedModelId)[safeRound] : null;
  const explainerBgColor = colorForCompany(explainerRound?.company ?? "");
  const explainerTextColor = pickTextColor(explainerBgColor);

  const [startSignal, setStartSignal] = useState(0);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          {/* <h1 className="text-xl font-semibold">Xent Labs Benchmark Race</h1> */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {raceData && (
              <button type="button" className="button" onClick={() => setStartSignal((n) => n + 1)}>
                Start tour
              </button>
            )}
          </div>
        </header>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        {!data && (
          <div className="text-sm opacity-75">Load a dataset JSON object: {"{ version, rounds }"}.</div>
        )}

        <div>
          <h1 className="text-3xl font-black max-w-2xl mb-2">
            Challenge for LLMs: find a prefix that minimises the cross entropy of a given text.
          </h1>
          <div className="text-xl font-semibold opacity-75">30 attempts; prefix of 10 tokens; no words from the text can be used.</div>
        </div>

        {raceData && (
          <ColorScaleProvider maxAbsScore={raceData.maxAbsScore * 0.6}>
            <div className="flex flex-col gap-3">

              <TourGuide
                raceData={raceData}
                playback={playbackState}
                setPlayback={setPlaybackState}
                focusedModelId={focusedModelId}
                setFocusedModelId={setFocusedModelId}
                startSignal={startSignal}
              />

              <div className="flex gap-6">
                <div className="min-w-2xl flex-1">
                  <div className="border rounded-md mb-2 p-3">
                    <BarRace
                      frames={frames}
                      topN={frames[0].length}
                      barHeight={24}
                      round={playbackState.round}
                      transitionDurationSec={Math.min(1, 1000 / (playbackState.speed || 1)) * 0.8}
                      onSelectedIdChange={handleSelectedIdChange}
                      heatmapMode="none"
                      getTokenScores={getTokenScores}
                    />
                  </div>

                  <BarRaceControls
                    playback={playbackState}
                    maxRound={Math.max(0, raceData.roundsLength - 1)}
                    totalRounds={raceData.roundsLength}
                    onPlaybackChange={setPlaybackState}
                  />
                </div>

                <div className="flex-1">
                  <Explainer vertical showFramework={false} />
                  {explainerRound && (<>
                    <h3 className="font-black text-xl mb-1 mt-6">Today&apos;s text to condense</h3>

                    <div className="">
                      <Logo src={explainerRound?.logo ?? ""} className="inline-block align-middle mr-1" alt={explainerRound?.company ?? ""} size={20} />

                      <span
                        className="px-2 mr-1 items-center align-middle"
                        style={{ color: explainerTextColor, backgroundColor: explainerBgColor }}
                      >
                        <span className="font-black mr-2">{explainerRound?.nice_model}</span>
                        <span className="" data-tour="explainer-move">{explainerRound?.bestMove}</span>
                      </span>

                      <TokenScoresBox tokenScores={explainerRound?.bestTokenScores} className="inline align-middle" />
                    </div>
                  </>
                  )}
                </div>

              </div>

              <GameDisplayWithDetails game={leftRounds} className="mt-6" />

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
