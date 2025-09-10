"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Playback } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import type { AugmentedFrame, BarRaceFrame } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarRaceControls, usePlayback } from "@/components/BarRaceControls";
import { ColorScaleProvider } from "@/components/ColorScaleContext";
import type { TokenScoresList } from "@/lib/types";
import { useDataset } from "@/hooks/useDataset";
import { GameDisplayWithDetails } from "@/components/GameDisplayWithDetails";
import TourGuide, { TourAnchor, anchorToProps, Anchors } from "@/components/TourGuide";
import DailyCalendar from "@/components/DailyCalendar";
import { useDailyGameSelection } from "@/hooks/useDailyGameSelection";


export default function Home() {
  const { selectedGameUrl, selectedDateUTC, selectDate } = useDailyGameSelection("2025-09-05");
  const { game, raceData, error } = useDataset(selectedGameUrl);

  const frames = useMemo(() => (raceData ? raceData.buildFrames() : []), [raceData]);

  const { playback: playbackState, setPlayback: setPlaybackState } = usePlayback(
    raceData?.roundsLength ?? 0,
    { isPlaying: true, round: 0, speed: 1 }
  );

  // Reset round to 0 state when race data changes
  useEffect(() => {
    setPlaybackState((s) => ({ ...s, round: 0 }));
    setFocusedModelId(raceData?.finalists()[0] ?? null);
  }, [raceData]);

  const stepDurationMs = Math.max(1, Math.round(1000 / (playbackState.speed || 1)) * 0.7);

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


  // --- Calendar State & Logic ---
  const monthLabel = selectedDateUTC ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", timeZone: "UTC" }).format(selectedDateUTC) : "";

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {game && (
          <TourAnchor anchor={Anchors.todaysGame} className="max-w-3xl ">
            <div className="text-lg font-black mb-1 text-blue-600">Xent Labs Benchmark Showcase</div>
            <h1 className="text-3xl font-black mb-2">
              {game.pageTitle}
            </h1>

            <TourAnchor anchor={Anchors.gameRules} className="">
              <div className="">{game.subtitle}</div>
            </TourAnchor>
          </TourAnchor>
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
                setFocusedModelId={setFocusedModelId}
                startSignal={startSignal}
                game={game}
              />
              <div className="flex gap-6 w-full">
                <div className="flex-1">

                  <BarRaceControls
                    playback={playbackState}
                    totalRounds={raceData.roundsLength}
                    onPlaybackChange={setPlaybackState}
                  />

                  <TourAnchor anchor={Anchors.barRace} className="border rounded-md mt-2 p-3">
                    <BarRace
                      frames={frames}
                      barHeight={24}
                      round={playbackState.round}
                      transitionDurationSec={stepDurationMs * 0.8 / 1000}
                      onSelectedIdChange={handleSelectedIdChange}
                      heatmapMode="prefix"
                      selectedId={focusedModelId}
                      heatmapLines={game.barRaceOptions?.heatmapLines}
                      displayDescription={game.barRaceOptions?.displayMove}
                      moveAlignment={game.barRaceOptions?.moveAlignment}
                    />
                  </TourAnchor>

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

        {/* Calendar / Archive */}
        <div className="mt-12 border rounded-md p-3">
          <div className="font-semibold text-sm mb-2">Winners of {monthLabel}</div>
          <DailyCalendar
            selectedDateUTC={selectedDateUTC}
            onSelectDay={selectDate}
          />
        </div>
      </div>
    </div>
  );
}