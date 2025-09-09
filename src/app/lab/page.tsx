"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDataset } from "@/hooks/useDataset";
import { ModelHistoryChart } from "@/components/ModelHistoryChart";
import { EventsDisplay } from "@/components/EventsDisplay";
import { RoundModelWithBest } from "@/lib/barRace";
import { computeEvents, selectEvent } from "@/components/TourGuide";
import type { Event } from "@/lib/tour/types";
import { GameDisplayWithDetails } from "@/components/GameDisplayWithDetails";
import { BarRace } from "@/components/BarRace";
import { Slider } from "@/components/Slider";
import { ControlBar } from "@/components/ControlBar";

export default function LabPage() {
  const { game, raceData, error, loadFromUrl } = useDataset();

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

  // Events detection and selection
  const allEvents = useMemo(() => (raceData ? computeEvents(raceData) : []), [raceData]);
  const selectedEvent = useMemo(() => selectEvent(allEvents), [allEvents]);
  const [selectedEventForDisplay, setSelectedEventForDisplay] = useState<Event | null>(null);

  // Handle event selection - update model and round
  const handleEventSelect = (event: Event | null) => {
    setSelectedEventForDisplay(event);
    if (event) {
      setSelectedModelId(event.modelId);
      setRoundIndex(event.round);
    }
  };

  // Handle BarRace model/round selection
  const handleBarRaceSelection = (modelId: string | null, round: number) => {
    if (modelId) {
      setSelectedModelId(modelId);
    }
    setRoundIndex(round);
  };

  const rounds = useMemo(() => {
    if (!raceData || !selectedModelId) return [] as RoundModelWithBest[];
    return raceData.roundsFor(selectedModelId);
  }, [raceData, selectedModelId]);

  return (
    <div className="flex flex-col h-screen">
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
          <h1 className="text-2xl font-bold mb-2">Lab</h1>
          <p className="text-sm opacity-80 mb-6">Scratchpad for experimental data‑viz components. Not linked from the main page.</p>

          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-100/20 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {raceData && (
            <div className="space-y-6">
              <div>
                <div className="text-xs opacity-70 mb-1">Game</div>
                <div className="font-semibold">{game?.name ?? "(unknown)"}</div>
              </div>

              {/* Events Detection Section */}
              <section className="border rounded-md p-3">
                <h2 className="font-semibold mb-2">Detected Events</h2>
                <div className="text-xs opacity-70 mb-3">
                  Events detected by the tour system, sorted by tour priority. The selected event (if any) would be used for the guided tour.
                </div>
                <EventsDisplay
                  events={allEvents}
                  selectedEvent={selectedEventForDisplay}
                  onEventSelect={handleEventSelect}
                  onModelSelect={setSelectedModelId}
                />
              </section>

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

              <section className="border rounded-md p-3">
                <h2 className="font-semibold mb-2">GameDisplayWithDetails</h2>
                <GameDisplayWithDetails game={rounds} />
              </section>

              <section className="border rounded-md p-3">
                <h2 className="font-semibold mb-2">BarRace</h2>
                <BarRace
                  frames={raceData.buildFrames()}
                  round={roundIndex}
                  selectedId={selectedModelId}
                  heatmapMode="prefix"
                  onSelectedIdChange={handleBarRaceSelection}
                />
              </section>

            </div>
          )}

          {!raceData && !error && (
            <div className="text-sm opacity-80">Load or upload a dataset to get started.</div>
          )}
        </div>
      </div>

      {/* Fixed bottom control bar */}
      <ControlBar>
        {/* Dataset selector */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Dataset</label>
          <select
            className="rounded-md border px-3 py-2 bg-transparent text-sm min-w-[200px]"
            value={selectedFile}
            onChange={(e) => {
              setSelectedFile(e.target.value);
              if (e.target.value) {
                loadFromUrl(e.target.value);
              }
            }}
          >
            <option value="">— Select a file —</option>
            {availableFiles.map((f) => (
              <option key={f.url} value={f.url}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Model selector */}
        {raceData && (
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Model</label>
            <select
              className="rounded-md border px-3 py-2 bg-transparent text-sm min-w-[150px]"
              value={selectedModelId ?? ""}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              {modelIds.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Round slider */}
        {raceData && selectedModelId && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
              Round {roundIndex + 1} / {raceData.roundsLength}
            </label>
            <Slider
              min={0}
              max={Math.max(0, raceData.roundsLength - 1)}
              value={roundIndex}
              onValueChange={setRoundIndex}
              className="w-full"
            />
          </div>
        )}
      </ControlBar>
    </div>
  );
}