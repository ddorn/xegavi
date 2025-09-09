"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Playback } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import type { AugmentedFrame, BarRaceFrame } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarRaceControls } from "@/components/BarRaceControls";
import { ColorScaleProvider } from "@/components/ColorScaleContext";
import type { TokenScoresList } from "@/lib/types";
import { useDataset } from "@/hooks/useDataset";
import { GameDisplayWithDetails } from "@/components/GameDisplayWithDetails";
import TourGuide from "@/components/TourGuide";

export default function Home() {
  const { game, raceData, error, onFile, loadFromUrl } = useDataset();

  const [gameFiles, setGameFiles] = useState<Array<{ name: string | null; url: string; }>>([]);
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/games", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        setGameFiles(json.files ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

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

  const stepDurationMs = Math.max(1, Math.round(1000 / (playbackState.speed || 1)) * 0.7);

  useEffect(() => {
    const n = raceData?.roundsLength ?? 0;
    if (!playbackState.isPlaying || n === 0) return;
    const id = setInterval(() => {
      setPlaybackState((s) => ({ ...s, round: (s.round + 1) % Math.max(1, n) }));
    }, stepDurationMs);
    return () => clearInterval(id);
  }, [playbackState.isPlaying, stepDurationMs, raceData?.roundsLength]);

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

  const getTokenScores = useCallback((id: string, round: number): TokenScoresList | null => {
    return raceData ? raceData.tokenScoresAt(id, round) : null;
  }, [raceData]);

  const [startSignal, setStartSignal] = useState(0);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <select
              className="border rounded-md px-2 py-1 bg-white dark:bg-neutral-800 dark:border-neutral-700 text-sm"
              onChange={(e) => {
                const v = e.target.value;
                if (v) {
                  loadFromUrl(v);
                }
              }}
              defaultValue="/games/Condense_14.json"
              title="Load a sample game dataset"
            >
              <option value="" disabled>Load sample…</option>
              {gameFiles.map((f) => (
                <option key={f.url} value={f.url}>{f.name}</option>
              ))}
            </select>
          </div>
        </header>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {game && (
          <div data-tour="todays-game" className="max-w-3xl ">
            <div className="text-lg font-black mb-1 text-blue-600">Xent Labs Benchmark Showcase</div>
            <h1 className="text-3xl font-black mb-2">
              {game.pageTitle}
            </h1>

            <div className="" data-tour="game-rules">
              <div className="">{game.subtitle}</div>
            </div>
          </div>
        )}

        {raceData && game && (
          <ColorScaleProvider maxAbsScore={raceData.maxAbsScore * 0.6}>
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setStartSignal((n) => n + 1)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-shadow shadow-md"
              >
                <span>✨</span>
                <span>What is this?</span>
              </button>
            </div>

            <h2 className="text-2xl font-black #mb-2 #text-center">See how models are doing on today&apos;s game ⬇</h2>

            <div className="flex flex-col gap-3 items-start">
              <div className="flex">
                {game.roundDisplay({ raceData, focusedModelId, round: safeRound })}
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

                  <BarRaceControls
                    playback={playbackState}
                    maxRound={Math.max(0, raceData.roundsLength - 1)}
                    totalRounds={raceData.roundsLength}
                    onPlaybackChange={setPlaybackState}
                  />

                  <div className="border rounded-md mt-2 p-3">
                    <BarRace
                      frames={frames}
                      barHeight={24}
                      round={playbackState.round}
                      transitionDurationSec={stepDurationMs * 0.8 / 1000}
                      onSelectedIdChange={handleSelectedIdChange}
                      heatmapMode="prefix"
                      getTokenScores={getTokenScores}
                      selectedId={focusedModelId}
                      heatmapLines={game.barRaceOptions?.heatmapLines}
                      displayDescription={game.barRaceOptions?.displayMove}
                      moveAlignment={game.barRaceOptions?.moveAlignment}
                    />
                  </div>

                </div>

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
      name: it.niceModel,
      description: it.bestMove,
      value: it.bestScore,
      color: it.color,
      iconSrc: it.logoSrc ?? "",
      company: it.company,
    }))
  );
}
