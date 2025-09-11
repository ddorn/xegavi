"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import { BarRace } from "@/components/BarRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarRaceControls, usePlayback } from "@/components/BarRaceControls";
import { ColorScaleProvider } from "@/components/ColorScaleContext";
import { useDataset } from "@/hooks/useDataset";
import { GameDisplayWithDetails } from "@/components/GameDisplayWithDetails";
import { TourAnchor, Anchors } from "@/components/TourAnchor";
import DailyCalendar from "@/components/DailyCalendar";
import { useDailyGameSelection } from "@/hooks/useDailyGameSelection";
import { ProgressBar } from "@/components/ProgressBar";
import Highlights from "@/components/Highlights";
import { useTourManager } from "@/hooks/useTourManager";


export default function Home() {
  const { selectedGameUrl, selectedDateUTC, selectDate } = useDailyGameSelection("2025-09-05");
  const { game, raceData, error, isLoading } = useDataset(selectedGameUrl);

  const frames = useMemo(() => (raceData ? raceData.buildFrames() : []), [raceData]);

  const { playback: playbackState, setPlayback: setPlaybackState } = usePlayback(
    raceData?.roundsLength ?? 0,
    { isPlaying: true, round: 0, speed: 1 }
  );

  // Reset round to 0 state when race data changes
  useEffect(() => {
    setPlaybackState((s) => ({ ...s, round: 0 }));
    setFocusedModelId(raceData?.finalists()[0] ?? null);
  }, [raceData, setPlaybackState]);

  const stepDurationMs = Math.max(1, Math.round(1000 / (playbackState.speed || 1)) * 0.7);

  const [focusedModelId, setFocusedModelId] = useState<string | null>(null);

  const tourManager = useTourManager({
    raceData,
    playback: playbackState,
    setPlayback: setPlaybackState,
    setFocusedModelId,
    game: game ?? undefined,
  });

  const handleSelectedIdChange = useCallback((id: string | null) => {
    if (id !== null && id !== focusedModelId) {
      setFocusedModelId(id);
    }
  }, [focusedModelId]);

  const safeRound = useMemo(() => {
    const maxIdx = Math.max(0, (raceData?.augmented.length ?? 0) - 1);
    return Math.min(Math.max(0, playbackState.round), maxIdx);
  }, [playbackState.round, raceData?.augmented.length]);

  const leftRounds = focusedModelId && raceData ? raceData.roundsFor(focusedModelId) : [];

  // --- Calendar State & Logic ---
  const monthLabel = selectedDateUTC ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", timeZone: "UTC" }).format(selectedDateUTC) : "";

  return (
    <div className="min-h-screen px-2 xs:px-6 sm:p-10 py-6">
      {isLoading && <ProgressBar />}
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
                onClick={tourManager.startOnboardingTour}
                className="inline-flex items-center gap-2 rounded-md cursor-pointer bg-blue-600 px-4 py-3 text-white shadow-md transition hover:scale-105 hover:bg-blue-700 hover:shadow-lg active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600"
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

                  <Highlights raceData={raceData} onHighlightSelect={tourManager.startHighlightTour} />
                </div>

              </div>

              <GameDisplayWithDetails
                game={leftRounds}
                className="mt-6 w-full"
                finalRank={focusedModelId ? raceData.finalRankFor(focusedModelId) : undefined}
              />

              {/* Calendar / Archive */}
              <div className="self-stretch">
                <div className="text-lg font-black mb text-blue-600">Archive</div>
                <h2 className="text-2xl font-black mb-2">Winners of {monthLabel}</h2>
                <DailyCalendar
                  selectedDateUTC={selectedDateUTC}
                  onSelectDay={selectDate}
                  className="max-w-2xl"
                />
              </div>


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