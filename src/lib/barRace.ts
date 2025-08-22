import type { Dataset, RoundModel, TokenScores } from "@/lib/types";

export interface RoundModelWithBest extends RoundModel {
  bestRoundIndex: number;
  bestScore: number;
  bestMove: string;
  bestTokenScores: TokenScores | null;
}

export type BarRaceFrame = Record<string, RoundModelWithBest>;

/**
 * Compute per-round frames keyed by model name, augmenting each entry with
 * running-best fields (bestRoundIndex, bestScore, bestMove, bestTokenScores).
 *
 * Throws an explicit error if a model is missing in any round.
 */
export function computeBarRaceFrames(data: Dataset): Array<BarRaceFrame> {
  const roundsUnstructured = data.rounds;
  if (roundsUnstructured.length === 0) return [];

  const modelNames = roundsUnstructured[0].map((r) => r.model);

  const frames: Array<BarRaceFrame> = [];
  const bestIdxByModel: Record<string, number> = {};

  for (let i = 0; i < roundsUnstructured.length; i++) {
    const roundList = roundsUnstructured[i];
    const frame: BarRaceFrame = {};

    for (const model of modelNames) {
      const current = roundList.find((r) => r.model === model);
      if (!current) {
        throw new Error(`Dataset validation error: missing model '${model}' at round index ${i}`);
      }

      const prevBestIdx = bestIdxByModel[model] ?? 0;
      const prevBestRound = roundsUnstructured[prevBestIdx];
      const prevBest = prevBestRound.find((r) => r.model === model)!;

      const isFirst = i === 0 && bestIdxByModel[model] === undefined;
      const isBetter = isFirst || current.score > prevBest.score;
      const bestIdx = isBetter ? i : prevBestIdx;
      const best = isBetter ? current : prevBest;

      bestIdxByModel[model] = bestIdx;

      frame[model] = {
        ...current,
        bestRoundIndex: bestIdx,
        bestScore: best.score,
        bestMove: best.move,
        bestTokenScores: best.token_scores ?? null,
      };
    }

    frames.push(frame);
  }

  return frames;
}