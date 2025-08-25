"use client";

import { useCallback, useEffect, useState } from "react";
import { DatasetSchema, type Dataset } from "@/lib/types";
import { BarRace } from "@/components/BarRace";
import { TokenScoresBox } from "@/components/TokenScoresBox";
import type { RoundModelWithBest } from "@/lib/barRace";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<RoundModelWithBest | null>(null);

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
                data={data}
                topN={10}
                stepMs={1000}
                autoplay
                onActiveItemChange={setActive}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm ">
                {active ? (
                  <span>
                    Showing per-tokens scores for <strong>{active.nice_model ?? active.model}</strong> — score {active.bestScore.toFixed(2)}
                  </span>
                ) : (
                  <span>No selection yet.</span>
                )}
              </div>
              <div className="border rounded-md p-3">
                <TokenScoresBox tokenScores={active?.bestTokenScores ?? null} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
