import type { RaceData } from "@/lib/barRace";
import type { Event } from "./types";
import type { TokenScoresList } from "@/lib/types";

/**
 * Computes the ranking of models based on their best scores in a frame.
 * Returns an array of model IDs sorted by best score (highest first).
 */
function computeRanks(frame: Record<string, { bestScore: number }>): string[] {
  return Object.values(frame)
    .sort((a, b) => b.bestScore - a.bestScore)
    .map((it) => (it as any).model);
}

/**
 * Compares token scores between two rounds and finds the maximum change in a specific direction.
 * @param prevTokenScores Previous round's token scores
 * @param currTokenScores Current round's token scores
 * @param direction 'positive' to find biggest gain, 'negative' to find biggest loss
 * @returns Token change details or null if no change found
 */
function findMaxTokenChange(
  prevTokenScores: TokenScoresList | null,
  currTokenScores: TokenScoresList | null,
  direction: 'positive' | 'negative'
): {
  token: string;
  change: number;
  prevScore: number;
  currScore: number;
  seqIndex: number;
  tokenIndex: number;
} | null {
  if (!prevTokenScores || !currTokenScores) return null;

  const isPositive = direction === 'positive';
  let bestChange = isPositive ? -Infinity : Infinity;
  let bestToken = "";
  let prevScore = 0;
  let currScore = 0;
  let bestSeqIndex = 0;
  let bestTokenIndex = 0;

  // Compare corresponding token sequences
  for (let seqIndex = 0; seqIndex < Math.min(prevTokenScores.length, currTokenScores.length); seqIndex++) {
    const prevSeq = prevTokenScores[seqIndex];
    const currSeq = currTokenScores[seqIndex];

    // Compare corresponding tokens in the sequence
    for (let tokenIndex = 0; tokenIndex < Math.min(prevSeq.length, currSeq.length); tokenIndex++) {
      const [prevToken, prevTokenScore] = prevSeq[tokenIndex];
      const [currToken, currTokenScore] = currSeq[tokenIndex];

      // Only consider if it's the same token
      if (prevToken === currToken) {
        const change = currTokenScore - prevTokenScore;
        const isBetter = isPositive ? change > bestChange : change < bestChange;

        if (isBetter) {
          bestChange = change;
          bestToken = currToken;
          prevScore = prevTokenScore;
          currScore = currTokenScore;
          bestSeqIndex = seqIndex;
          bestTokenIndex = tokenIndex;
        }
      }
    }
  }

  // Check if we found a change in the desired direction
  const hasValidChange = isPositive ? bestChange > 0 : bestChange < 0;

  return hasValidChange ? {
    token: bestToken,
    change: bestChange,
    prevScore,
    currScore,
    seqIndex: bestSeqIndex,
    tokenIndex: bestTokenIndex
  } : null;
}

/**
 * Detects when a model reaches the top position for the first time.
 * Only triggers for models that weren't already in first place at the start.
 * The magnitude represents how many positions the model climbed.
 */
export function detectFirstToTop(race: RaceData): Event[] {
  const events: Event[] = [];
  if (race.augmented.length === 0) return events;
  const modelIds = Object.keys(race.augmented[0]);
  const startRanks: Record<string, number> = {};

  // Compute start ranks using bestScore in round 0 frame ordering
  const startFrame = race.augmented[0];
  const sortedStart = Object.values(startFrame).sort((a, b) => b.bestScore - a.bestScore);
  for (let i = 0; i < sortedStart.length; i++) {
    startRanks[sortedStart[i].model] = i + 1;
  }

  const seen = new Set<string>();
  for (let r = 0; r < race.augmented.length; r++) {
    const frame = race.augmented[r];
    const sorted = Object.values(frame).sort((a, b) => b.bestScore - a.bestScore);
    const leader = sorted[0];
    const leaderId = leader.model;

    if (!seen.has(leaderId)) {
      const startRank = startRanks[leaderId] ?? 1;
      if (startRank > 1) {
        const magnitudeRaw = startRank - 1; // Number of positions climbed
        const magnitudeNorm = (startRank - 1) / Math.max(1, modelIds.length - 1);
        events.push({
          type: "first_to_top",
          modelId: leaderId,
          round: r,
          magnitudeRaw,
          magnitudeNorm,
          details: { startRank },
        });
      }
      seen.add(leaderId);
    }
  }
  return events;
}

/**
 * Detects the round where each model had its biggest score improvement.
 * Finds the single round with the largest positive score change for each model.
 * The magnitude is the score increase multiplied by n / (n+2) where n is the
 * round where it happens. This deprioritizes early jumps.
 */
export function detectBigJumps(race: RaceData): Event[] {
  const events: Event[] = [];
  const modelIds = Object.keys(race.augmented[0] ?? {});

  for (const modelId of modelIds) {
    let bestDelta = -Infinity;
    let bestRound = 0;
    let prev = race.augmented[0][modelId].bestScore;

    for (let r = 1; r < race.augmented.length; r++) {
      const cur = race.augmented[r][modelId].bestScore;
      const delta = cur - prev;
      if (delta > bestDelta) {
        bestDelta = delta;
        bestRound = r;
      }
      prev = cur;
    }

    if (bestDelta > Number.NEGATIVE_INFINITY && bestDelta > 0) {
      const magnitudeRaw = bestDelta;
      const magnitudeNorm = bestDelta * bestRound / (bestRound + 2)
      events.push({
        type: "big_jump",
        modelId,
        round: bestRound,
        magnitudeRaw,
        magnitudeNorm,
        details: {
          delta: bestDelta,
          previousScore: race.augmented[bestRound - 1][modelId].bestScore,
          newScore: race.augmented[bestRound][modelId].bestScore
        }
      });
    }
  }
  return events;
}

/**
 * Detects when the leading model changes between rounds.
 * Tracks leadership transitions and measures the margin between new leader and runner-up.
 * The magnitude represents the score difference between leader and second place.
 */
export function detectLeadChanges(race: RaceData): Event[] {
  const events: Event[] = [];

  let prevLeader: string | null = null;
  for (let r = 0; r < race.augmented.length; r++) {
    const frame = race.augmented[r];
    const sorted = Object.values(frame).sort((a, b) => b.bestScore - a.bestScore);
    if (sorted.length < 2) continue;

    const leader = sorted[0];
    const runnerUp = sorted[1];
    const leaderId = leader.model;

    if (prevLeader !== null && leaderId !== prevLeader) {
      const margin = leader.bestScore - runnerUp.bestScore;
      const magnitudeRaw = margin;
      const magnitudeNorm = margin;
      events.push({
        type: "lead_change",
        modelId: leaderId,
        round: r,
        magnitudeRaw,
        magnitudeNorm,
        details: {
          previousLeaderId: prevLeader,
          margin,
          leaderScore: leader.bestScore,
          runnerUpScore: runnerUp.bestScore
        },
      });
    }
    prevLeader = leaderId;
  }
  return events;
}

/**
 * Detects rounds where a model has the largest positive token score change.
 * Compares token scores between consecutive rounds to find the biggest gain.
 * The magnitude represents the actual score increase of the token.
 */
export function detectMaxTokenPositive(race: RaceData): Event[] {
  const events: Event[] = [];

  for (let r = 1; r < race.augmented.length; r++) {
    const prevFrame = race.augmented[r - 1];
    const currFrame = race.augmented[r];

    for (const modelId of Object.keys(currFrame)) {
      const prevModel = prevFrame[modelId];
      const currModel = currFrame[modelId];

      const tokenChange = findMaxTokenChange(prevModel.bestTokenScores, currModel.bestTokenScores, 'positive');

      if (tokenChange) {
        events.push({
          type: "max_token_positive",
          modelId,
          round: r,
          magnitudeRaw: tokenChange.change,
          magnitudeNorm: tokenChange.change,
          details: {
            token: tokenChange.token,
            previousScore: tokenChange.prevScore,
            currentScore: tokenChange.currScore,
            change: tokenChange.change,
            seqIndex: tokenChange.seqIndex,
            tokenIndex: tokenChange.tokenIndex
          }
        });
      }
    }
  }
  return events;
}

/**
 * Detects rounds where a model has the largest negative token score change.
 * Compares token scores between consecutive rounds to find the biggest loss.
 * The magnitude represents the absolute value of the score decrease of the token.
 */
export function detectMaxTokenNegative(race: RaceData): Event[] {
  const events: Event[] = [];

  for (let r = 1; r < race.augmented.length; r++) {
    const prevFrame = race.augmented[r - 1];
    const currFrame = race.augmented[r];

    for (const modelId of Object.keys(currFrame)) {
      const prevModel = prevFrame[modelId];
      const currModel = currFrame[modelId];

      const tokenChange = findMaxTokenChange(prevModel.bestTokenScores, currModel.bestTokenScores, 'negative');

      if (tokenChange) {
        const absChange = Math.abs(tokenChange.change);
        events.push({
          type: "max_token_negative",
          modelId,
          round: r,
          magnitudeRaw: absChange,
          magnitudeNorm: absChange,
          details: {
            token: tokenChange.token,
            previousScore: tokenChange.prevScore,
            currentScore: tokenChange.currScore,
            change: tokenChange.change,
            absChange,
            seqIndex: tokenChange.seqIndex,
            tokenIndex: tokenChange.tokenIndex
          }
        });
      }
    }
  }
  return events;
}

/**
 * Returns all available event detector functions.
 * These detectors analyze race data to identify significant events that can be used
 * for tour guidance or highlighting interesting moments in the competition.
 */
export function allDetectors(): Array<(race: RaceData) => Event[]> {
  return [
    detectFirstToTop,
    detectLeadChanges,
    detectBigJumps,
    detectMaxTokenPositive,
    detectMaxTokenNegative,
  ];
}