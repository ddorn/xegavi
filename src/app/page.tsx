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
import { Logo } from "@/components/Logo";
import TourGuide from "@/components/TourGuide";
import { TokenMultilineText } from "@/components/TokenMultilineText";

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
          </div>
        </header>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        {!data && (
          <div className="text-sm opacity-75">Load a dataset JSON object: {"{ version, rounds }"}.</div>
        )}

        <div data-tour="todays-game" className="max-w-3xl ">
          <div className="text-lg font-black mb-1 text-blue-600">Xent Labs Benchmark showcase</div>
          <h1 className="text-3xl font-black mb-2">
            Challenge for LLMs: find a surprise-minimizing prefix for a given text.
          </h1>

                <div className="" data-tour="game-rules">
                  <div className="">There are 3 rules: models have 30 attempts; prefixes are up to 10 tokens; and no words from the text can be used.</div>
                </div>

        </div>


        {raceData && (
          <ColorScaleProvider maxAbsScore={raceData.maxAbsScore * 0.6}>
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setStartSignal((n) => n + 1)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-shadow shadow-md"
              >
                <span className="">✨</span>
                <span>Take the 30‑second tour</span>
              </button>
            </div>

            <h2 className="text-2xl font-black #mb-2 #text-center">See how models are doing on today&apos;s game ⬇</h2>

            <div className="flex flex-col gap-3 items-start">
              <div className="flex">

                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-baseline gap-x-2 gap-y-2 mb-2" >
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Prefix:</div>
                    <div>
                        <Logo src={explainerRound?.logo ?? ""} className="inline-block align-middle mr-1" alt={explainerRound?.company ?? ""} size={20} />

                        <span
                            className="px-2 mr-1 items-center align-middle"
                            style={{ color: explainerTextColor, backgroundColor: explainerBgColor }}
                        >
                            <span className="font-black mr-2">{explainerRound?.nice_model}</span>
                            <span className="overflow-scroll" data-tour="explainer-move">{explainerRound?.bestMove}</span>
                        </span>
                    </div>

                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Today&apos;s text:</div>
                    <div data-tour="explainer-tokens">
                        <TokenMultilineText tokenScores={explainerRound?.bestTokenScores ?? []} numLines={3} />
                    </div>
                </div>

              </div>

              <TourGuide
                raceData={raceData}
                playback={playbackState}
                setPlayback={setPlaybackState}
                focusedModelId={focusedModelId}
                setFocusedModelId={setFocusedModelId}
                startSignal={startSignal}
              />
              <div className="flex gap-6 w-full">
                <div className="flex-1">
                  <div className="border rounded-md mb-2 p-3">
                    <BarRace
                      frames={frames}
                      barHeight={24}
                      round={playbackState.round}
                      transitionDurationSec={Math.min(1, 1000 / (playbackState.speed || 1)) * 0.8}
                      onSelectedIdChange={handleSelectedIdChange}
                      heatmapMode="prefix"
                      getTokenScores={getTokenScores}
                      selectedId={focusedModelId}
                    />
                  </div>

                  <BarRaceControls
                    playback={playbackState}
                    maxRound={Math.max(0, raceData.roundsLength - 1)}
                    totalRounds={raceData.roundsLength}
                    onPlaybackChange={setPlaybackState}
                  />
                </div>

                {/* <div className="flex-1 hidden">
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

                      <TokenMultilineText tokenScores={explainerRound?.bestTokenScores} numLines={0} className="inline align-middle" />
                    </div>
                  </>
                  )}

                </div> */}

              </div>

              <GameDisplayWithDetails game={leftRounds} className="mt-6 w-full" />

              <div className="my-12 self-center text-center">
                <h2 className="text-xl font-black mb-2">What&apos;s next?</h2>
                <div className="flex gap-2">
                  <a href="https://xent.games" target="_blank" rel="noopener noreferrer" className="inverted-button">Play the game</a>
                  <a href="https://www.xentlabs.ai/blog/xent-benchmark" target="_blank" rel="noopener noreferrer" className="inverted-button">Read more on our blog</a>
                </div>
              </div>

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
