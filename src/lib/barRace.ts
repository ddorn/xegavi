import type { Dataset, RoundModel, TokenScoresList } from "@/lib/types";
import { deriveModelPresentation } from "@/lib/model-metadata";

export interface RoundModelWithBest extends RoundModel {
  bestRoundIndex: number;
  bestScore: number;
  bestMove: string;
  bestTokenScores: TokenScoresList;
  // Derived presentation fields for convenience
  niceModel: string;
  company: string;
  color: string;
  logoSrc: string | null;
}

export type AugmentedFrame = Record<string, RoundModelWithBest>;

export type BarRaceItem = {
  id: string;
  name: string;
  description: string;
  value: number;
  color: string;
  iconSrc: string;
  tokenScoresList?: TokenScoresList;
};

export type BarRaceFrame = BarRaceItem[];

// Class focusing on dataset augmentation and domain helpers
export class RaceData {
  readonly data: Dataset;
  readonly augmented: AugmentedFrame[];
  readonly maxAbsScore: number;

  constructor(data: Dataset) {
    this.data = data;
    this.augmented = this.augmentDatasetWithBest();
    this.maxAbsScore = this.computeMaxAbsScore();
  }

  get roundsLength(): number {
    return this.augmented.length;
  }

  /**
   * Pick the two models with the highest bestScore at the final round.
   * Returns a tuple of model ids. If fewer than two exist, the second may be undefined.
   */
  finalists(): [string | undefined, string | undefined] {
    if (this.augmented.length < 2) return [undefined, undefined];
    const last = this.augmented[this.augmented.length - 1];
    const sorted = Object.values(last)
      .sort((a, b) => b.bestScore - a.bestScore)
      .map((it) => it.model);
    return [sorted[0], sorted[1]];
  }

  itemAt(id: string, roundIndex: number) {
    return this.augmented[roundIndex]?.[id] ?? null;
  }

  tokenScoresAt(id: string, roundIndex: number, best: boolean = true): TokenScoresList | null {
    const item = this.itemAt(id, roundIndex);
    if (!item) return null;
    if (best) return item.bestTokenScores ?? null;
    return item.tokenScores ?? null;
  }

  historyFor(id: string): number[] {
    return this.augmented.map((frame) => frame[id]!.score);
  }

  roundsFor(id: string) {
    return this.augmented.map((frame) => frame[id]!).filter(Boolean);
  }

  /**
   * Calculate the final rank of a model based on its best score at the end of the game.
   * Returns 1-based rank (1 = first place, 2 = second place, etc.)
   */
  finalRankFor(modelId: string): number {
    if (this.augmented.length === 0) return 1;

    const finalFrame = this.augmented[this.augmented.length - 1];
    const sorted = Object.values(finalFrame).sort((a, b) => b.bestScore - a.bestScore);

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].model === modelId) {
        return i + 1; // 1-based ranking
      }
    }

    return sorted.length; // fallback if model not found
  }


  /** Builds frames suitable for the BarRace */
  buildFrames(useBestMove: boolean = true): BarRaceFrame[] {
    const augmented = this.augmented;
    return augmented.map((frame) =>
      Object.values(frame).map((it) => ({
        id: it.model,
        name: it.niceModel,
        description: useBestMove ? it.bestMove : it.move,
        value: useBestMove ? it.bestScore : it.score,
        color: it.color,
        iconSrc: it.logoSrc ?? "",
        company: it.company,
        tokenScoresList: useBestMove ? it.bestTokenScores : it.tokenScores,
      }))
    );
  }


  /**
   * Compute per-round frames keyed by model name, augmenting each entry with
   * running-best fields (bestRoundIndex, bestScore, bestMove, bestTokenScores).
   *
   * Throws an explicit error if a model is missing in any round.
   */
  private augmentDatasetWithBest(): AugmentedFrame[] {
    const roundsUnstructured = this.data.rounds;
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

        const { niceModel, company, color, logoName } = deriveModelPresentation(model);

        frame[model] = {
          ...current,
          bestRoundIndex: bestIdx,
          bestScore: best.score,
          bestMove: best.move,
          bestTokenScores: best.tokenScores,
          niceModel,
          company,
          color,
          logoSrc: logoName,
        };
      }

      frames.push(frame);
    }

    return frames;
  }

  private computeMaxAbsScore(): number {
    let m = 0;
    for (const rounds of this.data.rounds) {
      for (const r of rounds) {
        for (const seq of r.tokenScores) {
          for (const [, s] of seq) {
            const a = Math.abs(s);
            if (a > m) m = a;
          }
        }
      }
    }
    return m;
  }
}