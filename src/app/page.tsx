"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DatasetSchema, type Dataset } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import { TokenScoresBox } from "@/components/TokenScoresBox";
import type { RoundModelWithBest } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildRace } from "@/lib/barRace";

export default function Home() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  // removed unused active state

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

  const [selection, setSelection] = useState<{ id: string | null; round: number; }>({ id: null, round: 0 });

  // useCallback to avoid re-rendering BarRace in a loop when the selection changes
  const handleSelectedIdChange = useCallback((id: string | null, round: number) => {
    setSelection((prev) => (prev.id === id && prev.round === round ? prev : { id, round }));
  }, []);

  const activeItem: RoundModelWithBest | null = useMemo(() => {
    const rounds = race.augmented.length;
    if (rounds === 0) return null;
    const round = Math.min(Math.max(selection.round, 0), rounds - 1);
    const id = selection.id ?? Object.keys(race.augmented[round] ?? {})[0] ?? null;
    if (!id) return null;
    return race.augmented[round]?.[id] ?? null;
  }, [race, selection]);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Xentlab race</h1>
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
          <div className="flex flex-col gap-3">
            <div className="border rounded-md p-3">
              <BarRace
                frames={race.frames}
                topN={10}
                stepMs={1000}
                autoplay
                onSelectedIdChange={handleSelectedIdChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm ">
                {activeItem ? (
                  <span>
                    Showing per-tokens scores for <strong>{activeItem.nice_model ?? activeItem.model}</strong> — score {activeItem.bestScore.toFixed(2)}
                  </span>
                ) : (
                  <span>No selection yet.</span>
                )}
              </div>
              <div className="border rounded-md p-3">
                <TokenScoresBox tokenScores={activeItem?.bestTokenScores ?? null} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
