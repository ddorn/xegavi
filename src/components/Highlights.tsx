
"use client";

import { useMemo, useContext } from "react";
import type { RaceData } from "@/lib/barRace";
import type { Event } from "@/lib/tour/types";
import { computeEvents, selectHighlights, formatHighlight } from "@/lib/highlights";
import { useColorScale } from "./ColorScaleContext";
import { modelColor } from "@/lib/model-metadata";

type HighlightsProps = {
  raceData: RaceData | null;
  onHighlightSelect: (event: Event) => void;
};

function HighlightCard({ event, onClick }: { event: Event; onClick: () => void; }) {
  const text = formatHighlight(event);
  const color = modelColor(event.modelId);
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      style={{ borderTop: `4px solid ${color}`, background: `${color}30` }}
    >
      <p className="font-semibold text-gray-800 dark:text-gray-200">{text}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">in round {event.round + 1}</p>
    </div>
  );
}

export default function Highlights({ raceData, onHighlightSelect }: HighlightsProps) {
  const highlights = useMemo(() => {
    if (!raceData) return [];
    const allEvents = computeEvents(raceData);
    return selectHighlights(allEvents, 3);
  }, [raceData]);

  if (!raceData || highlights.length === 0) return null;

  return (
    <div className="my-8">
      <h2 className="mb-4 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Game Highlights
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {highlights.map((event) => (
          <HighlightCard
            key={`${event.type}-${event.modelId}-${event.round}`}
            event={event}
            onClick={() => onHighlightSelect(event)}
          />
        ))}
      </div>
    </div>
  );
}
