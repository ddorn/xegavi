import type { Dataset, RoundModel, TokenScores } from "@/lib/types";
import { colorForCompany } from "@/lib/colors";

export interface RoundModelWithBest extends RoundModel {
  bestRoundIndex: number;
  bestScore: number;
  bestMove: string;
  bestTokenScores: TokenScores | null;
}

export type AugmentedFrame = Record<string, RoundModelWithBest>;

export type BarRaceItem = {
  id: string;
  name: string;
  description: string;
  value: number;
  color: string;
  iconSrc: string;
};

export type BarRaceFrame = BarRaceItem[];

/**
 * Compute per-round frames keyed by model name, augmenting each entry with
 * running-best fields (bestRoundIndex, bestScore, bestMove, bestTokenScores).
 *
 * Throws an explicit error if a model is missing in any round.
 */
export function augmentDatasetWithBest(data: Dataset): Array<AugmentedFrame> {
  const roundsUnstructured = data.rounds;
  if (roundsUnstructured.length === 0) return [];

  const modelNames = roundsUnstructured[0].map((r) => r.model);

  const frames: Array<AugmentedFrame> = [];
  const bestIdxByModel: Record<string, number> = {};

  for (let i = 0; i < roundsUnstructured.length; i++) {
    const roundList = roundsUnstructured[i];
    const frame: AugmentedFrame = {};

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

/**
 * Adapter that turns a Dataset into both display frames and augmented frames.
 * Keeps Bar components domain-agnostic while centralizing mapping logic.
 */
export function buildRace(data: Dataset): { frames: BarRaceFrame[]; augmented: AugmentedFrame[] } {
  const augmented = augmentDatasetWithBest(data);
  const frames: BarRaceFrame[] = augmented.map((frame) =>
    Object.values(frame).map((it) => ({
      id: it.model,
      name: it.nice_model ?? it.model,
      description: it.bestMove,
      value: it.bestScore,
      color: colorForCompany(it.company),
      iconSrc: it.logo ?? "",
    }))
  );
  return { frames, augmented };
}