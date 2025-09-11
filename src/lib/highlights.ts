
import type { RaceData } from "@/lib/barRace";
import type { Event } from "./tour/types";
import { allDetectors } from "./tour/detectors";
import type { EventPolicy } from "./tour/policy";
import { DefaultPolicy } from "./tour/policy";
import { niceModelName } from "./model-metadata";


/**
 * Computes all significant events from race data using all available detectors.
 */
export function computeEvents(race: RaceData): Event[] {
  const detectors = allDetectors();
  return detectors.flatMap((fn) => fn(race));
}

/**
 * Selects the single most interesting event based on a scoring policy.
 */
export function selectEvent(events: Event[], policy: EventPolicy = DefaultPolicy): Event | null {
  const filtered = events.filter((e) => (policy.mins[e.type] ?? -Infinity) < e.magnitudeRaw);
  if (filtered.length === 0) return null;
  function scoreOf(e: Event): number {
    return (policy.weights[e.type] ?? 0) * e.magnitudeNorm;
  }
  // Deterministic sort: score desc -> magnitudeRaw desc -> earliest round -> modelId asc -> type lex
  const sorted = filtered.slice().sort((a, b) =>
    scoreOf(b) - scoreOf(a) ||
    b.magnitudeRaw - a.magnitudeRaw ||
    a.round - b.round ||
    a.modelId.localeCompare(b.modelId) ||
    a.type.localeCompare(b.type)
  );
  return sorted[0] ?? null;
}

/**
 * Selects a diverse set of highlights from a list of events.
 *
 * @param allEvents - The full list of detected events for a game.
 * @param count - The number of highlights to select.
 * @param policy - The scoring policy to rank events.
 * @returns An array of selected Event objects.
 */
export function selectHighlights(allEvents: Event[], count: number = 3, policy: EventPolicy = DefaultPolicy): Event[] {
  const highlights: Event[] = [];
  let candidates = [...allEvents];

  const scoreOf = (e: Event): number => {
    return (policy.weights[e.type] ?? 0) * e.magnitudeNorm;
  };

  for (let i = 0; i < count && candidates.length > 0; i++) {
    const modelCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    for (const h of highlights) {
      modelCounts[h.modelId] = (modelCounts[h.modelId] || 0) + 1;
      typeCounts[h.type] = (typeCounts[h.type] || 0) + 1;
    }

    candidates.sort((a, b) => {
      const modelPenaltyA = -2 * (modelCounts[a.modelId] || 0);
      const typePenaltyA = -1 * (typeCounts[a.type] || 0);
      const penaltyA = modelPenaltyA + typePenaltyA;

      const modelPenaltyB = -2 * (modelCounts[b.modelId] || 0);
      const typePenaltyB = -1 * (typeCounts[b.type] || 0);
      const penaltyB = modelPenaltyB + typePenaltyB;

      if (penaltyB !== penaltyA) {
        return penaltyB - penaltyA; // Sort by penalty descending (less negative is better)
      }

      return scoreOf(b) - scoreOf(a);
    });

    const best = candidates.shift();
    if (best) {
      highlights.push(best);
      // a modelId+type can be present in candidates multiple times (at different rounds)
      // remove all of them
      candidates = candidates.filter(c => c.modelId !== best.modelId || c.type !== best.type);
    }
  }
  // sort by round
  return highlights.sort((a,b) => a.round - b.round);
}

/**
 * Generates a human-readable string for a highlight event.
 * @param event The event to format.
 * @returns A descriptive string.
 */
export function formatHighlight(event: Event): string {
    const modelName = niceModelName(event.modelId);
    switch (event.type) {
        case "first_to_top":
            const rank = event.details.startRank;
            return `${modelName} reached #1, climbing ${rank-1} places.`;
        case "big_jump":
            return `${modelName} gained ${event.details.delta.toFixed(1)} points in one round.`;
        case "lead_change":
            return `${modelName} took the lead from ${niceModelName(event.details.previousLeaderId)}.`;
        case "max_token_positive":
            return `A single token change gave ${modelName} a big boost.`;
        case "max_token_negative":
            return `A single token change cost ${modelName} a lot.`;
        default:
          throw new Error(`Unknown event type: ${event}`);
    }
}
