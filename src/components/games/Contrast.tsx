import type { Dataset, GameDisplay, RawGameResult, RoundDisplayProps } from "@/lib/types";
import { RaceData } from "@/lib/barRace";
import { MoveAndTokenSections } from "@/components/MoveAndTokenSections";
import { parseBenchmarkToDataset, getRewardEvents, getElicitEvents } from "@/lib/dataset";

function ContrastRoundDisplay({ raceData, focusedModelId, round }: RoundDisplayProps) {
    const explainerRound = focusedModelId ? raceData.roundsFor(focusedModelId)[round] : null;
    const bg = explainerRound?.color ?? "#888";

    if (!explainerRound) return <div>No data</div>;

    return (
        <MoveAndTokenSections
            model={explainerRound.model}
            move={explainerRound.bestMove}
            sections={[
                { label: "Positive text:", tokenScoresList: [explainerRound.bestTokenScores?.[0] ?? []], numLines: 0 },
                { label: "Negative text:", tokenScoresList: [explainerRound.bestTokenScores?.[1] ?? []], numLines: 0 },
            ]}
        />
    );
}


export function convertContrastRound(round: RawGameResult) {
    const rewards = getRewardEvents(round);
    if (rewards.length !== 2) {
        throw new Error(`Contrast expects exactly 2 reward events, got ${rewards.length}`);
    }
    const [a, b] = rewards;
    const pos = a.value.scale === 1 ? a : b;
    const neg = a.value.scale === -1 ? a : b;
    if (pos.value.scale !== 1) {
        throw new Error(`Positive reward scale must be 1, got ${pos.value.scale}`);
    }
    if (neg.value.scale !== -1) {
        throw new Error(`Negative reward scale must be -1, got ${neg.value.scale}`);
    }
    const elicits = getElicitEvents(round);
    if (elicits.length !== 1) {
        throw new Error(`Contrast expects exactly 1 elicit event, got ${elicits.length}`);
    }
    const move = elicits[0].response;
    return { score: round.scores['black'], move, tokenScores: [pos.value.pairs, neg.value.pairs] };
}


function parseContrastBenchmarkToDataset(raw: unknown): Dataset {
    return parseBenchmarkToDataset(raw, convertContrastRound);
}

export const Contrast: GameDisplay = {
  name: "Contrast",
  pageTitle: "Challenge for LLMs: find a sentence that prefers one text and rejects another.",
  subtitle: (
    <div>Rules: models have 30 attempts; pick one sentence; maximize Pos text likelihood and minimize Neg text likelihood.</div>
  ),
  roundDisplay: (props) => <ContrastRoundDisplay {...props} />,
  barRaceData: (raw: unknown) => {
    const ds = parseContrastBenchmarkToDataset(raw);
      return new RaceData(ds);
  },
};