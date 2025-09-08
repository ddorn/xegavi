"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDataset } from "@/hooks/useDataset";
import { ModelHistoryChart } from "@/components/ModelHistoryChart";
import { RoundModelWithBest } from "@/lib/barRace";

export default function LabPage() {
  const { game, raceData, error, onFile, loadFromUrl } = useDataset();

  // List game files from the local API for easy selection
  const [availableFiles, setAvailableFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/games", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (isMounted) setAvailableFiles(json.files ?? []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Choose a default model when data loads
  const modelIds = useMemo(() => {
    if (!raceData) return [] as string[];
    const first = raceData.augmented[0] ?? {};
    return Object.keys(first);
  }, [raceData]);

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  useEffect(() => {
    if (modelIds.length > 0) setSelectedModelId((prev) => prev ?? modelIds[0] ?? null);
  }, [modelIds]);

  // Round index control
  const [roundIndex, setRoundIndex] = useState(0);
  useEffect(() => {
    setRoundIndex(0);
  }, [raceData]);

  const rounds = useMemo(() => {
    if (!raceData || !selectedModelId) return [] as RoundModelWithBest[];
    return raceData.roundsFor(selectedModelId);
  }, [raceData, selectedModelId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Lab</h1>
      <p className="text-sm opacity-80 mb-6">Scratchpad for experimental data‑viz components. Not linked from the main page.</p>

      {/* Data loading controls */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Pick a dataset</label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-transparent"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              <option value="">— Select a file —</option>
              {availableFiles.map((f) => (
                <option key={f.url} value={f.url}>{f.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-md px-3 py-2 bg-blue-600 text-white disabled:opacity-50"
            disabled={!selectedFile}
            onClick={() => selectedFile && loadFromUrl(selectedFile)}
          >
            Load
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Or upload a file</label>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-100/20 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {raceData && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-xs opacity-70 mb-1">Game</div>
              <div className="font-semibold">{game?.name ?? "(unknown)"}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                className="rounded-md border px-3 py-2 bg-transparent"
                value={selectedModelId ?? ""}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {modelIds.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Round</label>
              <input
                type="range"
                min={0}
                max={Math.max(0, raceData.roundsLength - 1)}
                value={roundIndex}
                onChange={(e) => setRoundIndex(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs opacity-70 mt-1">{roundIndex + 1} / {raceData.roundsLength}</div>
            </div>
          </div>

          {/* Experimental component showcase */}
          <section className="border rounded-md p-3">
            <h2 className="font-semibold mb-2">ModelHistoryChart</h2>
            {selectedModelId ? (
              <ModelHistoryChart
                rounds={rounds}
                roundIndex={roundIndex}
                onRoundChange={(idx) => setRoundIndex(idx)}
                height={160}
              />
            ) : (
              <div className="text-sm opacity-80">Select a model to view its history.</div>
            )}
          </section>
        </div>
      )}

      {!raceData && !error && (
        <div className="text-sm opacity-80">Load or upload a dataset to get started.</div>
      )}
    </div>
  );
}