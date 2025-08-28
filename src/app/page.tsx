"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DatasetSchema, type Dataset, type Playback } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import type { RoundModelWithBest } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildRace, getFinalistsByBestScore } from "@/lib/barRace";
import { BarRaceControls } from "@/components/BarRaceControls";
import { ModelRoundDetails } from "@/components/ModelRoundDetails";
import { TokenScoreHeatmap } from "@/components/TokenScoreHeatmap";
import { ColorScaleProvider } from "@/components/ColorScaleContext";
import type { HeatmapMode, TokenScores } from "@/lib/types";
import { CycleButton } from "@/components/CycleButton";

export default function Home() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = DatasetSchema.parse(JSON.parse(text));
      setData(parsed);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/load.json", { cache: "no-store" });
        if (!res.ok) return; // If not present, do nothing
        const json = await res.json();
        const parsed = DatasetSchema.parse(json);
        setData(parsed);
        setError(null);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      }
    })();
  }, []);

  const race = useMemo(() => (data ? buildRace(data) : { frames: [], augmented: [] }), [data]);

  const [playbackState, setPlaybackState] = useState<Playback>({ isPlaying: true, round: 0, speed: 1 });

  useEffect(() => {
    setPlaybackState((s) => ({ ...s, round: Math.min(s.round, Math.max(0, race.frames.length - 1)) }));
  }, [race.frames.length]);

  useEffect(() => {
    if (!playbackState.isPlaying || race.frames.length === 0) return;
    const stepMs = 1000;
    const effective = Math.max(1, Math.round(stepMs / (playbackState.speed || 1)));
    const id = setInterval(() => {
      setPlaybackState((s) => ({ ...s, round: (s.round + 1) % Math.max(1, race.frames.length) }));
    }, effective);
    return () => clearInterval(id);
  }, [playbackState.isPlaying, playbackState.speed, race.frames.length]);

  const [leftId, rightIdDefault] = useMemo(() => getFinalistsByBestScore(race.augmented), [race.augmented]);

  useEffect(() => {
    setPlaybackState((s) => ({ ...s, round: 0 }));
  }, [data]);

  // Right-column selection logic: follows clicked bar if present; otherwise defaults to second finalist;
  // ensure it differs from left finalist.
  const [clickedId, setClickedId] = useState<string | null>(null);
  const handleSelectedIdChange = useCallback((id: string | null, round: number) => {
    setClickedId(id);
  }, []);
  const handleRoundChange = useCallback((idx: number) => {
    setPlaybackState((s) => ({ ...s, round: idx }));
  }, []);

  const rightId = useMemo(() => {
    if (!race.augmented.length) return null;
    const fallback = rightIdDefault && rightIdDefault !== leftId ? rightIdDefault : (
      // choose any different id from the last frame
      Object.keys(race.augmented[race.augmented.length - 1] || {}).find((id) => id !== leftId) || null
    );
    if (clickedId && clickedId !== leftId) return clickedId;
    return fallback;
  }, [clickedId, rightIdDefault, leftId, race.augmented]);

  const safeRound = Math.min(Math.max(0, playbackState.round), Math.max(0, race.augmented.length - 1));
  const leftItem: RoundModelWithBest | null = leftId ? race.augmented[safeRound]?.[leftId] ?? null : null;
  const rightItem: RoundModelWithBest | null = rightId ? race.augmented[safeRound]?.[rightId] ?? null : null;

  const leftHistory = useMemo(() => {
    if (!leftId || !race.augmented.length) return [] as number[];
    return race.augmented.map((frame) => frame[leftId]!.score);
  }, [race.augmented, leftId]);

  const rightHistory = useMemo(() => {
    if (!rightId || !race.augmented.length) return [] as number[];
    return race.augmented.map((frame) => frame[rightId]!.score);
  }, [race.augmented, rightId]);

  const leftRounds = useMemo(() => {
    if (!leftId || !race.augmented.length) return [] as RoundModelWithBest[];
    return race.augmented.map((frame) => frame[leftId]!).filter(Boolean);
  }, [race.augmented, leftId]);

  const rightRounds = useMemo(() => {
    if (!rightId || !race.augmented.length) return [] as RoundModelWithBest[];
    return race.augmented.map((frame) => frame[rightId]!).filter(Boolean);
  }, [race.augmented, rightId]);

  const globalMaxAbsScore = useMemo(() => {
    if (!data) return 0;
    let m = 0;
    for (const rounds of data.rounds) {
      for (const r of rounds) {
        for (const [, s] of r.token_scores) {
          const a = Math.abs(s);
          if (a > m) m = a;
        }
      }
    }
    return m;
  }, [data]);


  const getTokenScores = useCallback((id: string, round: number): TokenScores | null => {
    const item = race.augmented[round]?.[id];
    if (!item) return null;
    // Use best token scores per your request
    return (item.bestTokenScores ?? item.token_scores) || null;
  }, [race.augmented]);

  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("prefix");
  const HEATMAP_STEPS = [
    "none",
    "prefix",
    "full",
    "overlayAligned",
    "bottomStripe",
  ] as const satisfies readonly HeatmapMode[];

  const formatHeatmap = (m: HeatmapMode) => {
    switch (m) {
      case "none":
        return "No heatmap";
      case "prefix":
        return "Prefix";
      case "full":
        return "Full";
      case "overlayAligned":
        return "Overlay";
      case "bottomStripe":
        return "Stripe";
      default:
        return m;
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* <div className="flex items-center gap-2">
          <div className="">Current experiment, heatmap mode:</div>
          <CycleButton
            value={heatmapMode}
            steps={HEATMAP_STEPS}
            onChange={(next) => setHeatmapMode(next)}
            className="button"
            ariaLabel="Change heatmap mode"
            format={formatHeatmap}
          />
        </div> */}

        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Xent Labs Benchmark Race</h1>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-3">
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
            </label>
            <ThemeToggle />
          </div>
        </header>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        {!data && (
          <div className="text-sm opacity-75">Load a dataset JSON object: {"{ version, rounds }"}.</div>
        )}

        {data && (
          <ColorScaleProvider maxAbsScore={globalMaxAbsScore * 0.6}>
            <div className="flex flex-col gap-3">
              <div className="">
                <BarRaceControls
                  playback={playbackState}
                  maxRound={Math.max(0, race.frames.length - 1)}
                  totalRounds={race.frames.length}
                  onPlaybackChange={setPlaybackState}
                />
              </div>

              <div className="border rounded-md p-3">
                <BarRace
                  frames={race.frames}
                  topN={race.frames[0].length}
                  barHeight={24}
                  round={playbackState.round}
                  transitionDurationSec={Math.min(1, 1000 / (playbackState.speed || 1)) * 0.8}
                  onSelectedIdChange={handleSelectedIdChange}
                  heatmapMode={heatmapMode}
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
