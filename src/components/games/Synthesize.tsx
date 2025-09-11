import type { Dataset, GameDisplay, RawGameResult, RoundDisplayProps } from "@/lib/types";
import { RaceData } from "@/lib/barRace";
import { MoveAndTokenSections } from "@/components/MoveAndTokenSections";
import { parseBenchmarkToDataset, getRewardEvents, getElicitEvents } from "@/lib/dataset";
import { anchorSelector, Anchors } from "../TourAnchor";

function SynthesizeRoundDisplay({ raceData, focusedModelId, round }: RoundDisplayProps) {
    const explainerRound = focusedModelId ? raceData.roundsFor(focusedModelId)[round] : null;
    const bg = explainerRound?.color ?? "#888";

    if (!explainerRound) return <div>No data</div>;

    return (
        <MoveAndTokenSections
            model={explainerRound.model}
            move={explainerRound.bestMove}
            sections={[
                { label: "Text 1:", tokenScoresList: [explainerRound.bestTokenScores?.[0] ?? []], numLines: 0 },
                { label: "Text 2:", tokenScoresList: [explainerRound.bestTokenScores?.[1] ?? []], numLines: 0 },
                { label: "Text 3:", tokenScoresList: [explainerRound.bestTokenScores?.[2] ?? []], numLines: 0 },
            ]}
        />
    );
}

export function convertSynthesizeRound(round: RawGameResult) {
    const rewards = getRewardEvents(round);
    if (rewards.length !== 3) {
        throw new Error(`Synthesize expects exactly 3 reward events, got ${rewards.length}`);
    }
    const [r1, r2, r3] = rewards;
    if (r1.value.scale !== 1 || r2.value.scale !== 1 || r3.value.scale !== 1) {
        throw new Error(`Unsupported scale for reward: expected all scales to be 1`);
    }

    const elicits = getElicitEvents(round);
    if (elicits.length !== 1) {
        throw new Error(`Synthesize expects exactly 1 elicit event, got ${elicits.length}`);
    }
    const move = elicits[0].response;

    return { score: round.scores['black'], move, tokenScores: [r1.value.pairs, r2.value.pairs, r3.value.pairs] };
}

function parseSynthesizeBenchmarkToDataset(raw: unknown): Dataset {
    return parseBenchmarkToDataset(raw, convertSynthesizeRound);
}

export const Synthesize: GameDisplay = {
  name: "Synthesize",
  pageTitle: "Challenge for LLMs: find a prefix that minimizes the cross-entropy across three texts.",
  subtitle: (
    <div>There are 3 rules: models have 30 attempts; prefixes are up to 10 tokens; and no words from the texts can be used.</div>
  ),
  roundDisplay: (props) => <SynthesizeRoundDisplay {...props} />,
  barRaceData: (raw: unknown) => {
    const ds = parseSynthesizeBenchmarkToDataset(raw);
    return new RaceData(ds);
  },
    tourIntro: {
        steps: [
            {
                text: "In Synthesize, a short prefix should help predict three unrelated texts at once.",
                attachTo: { element: anchorSelector(Anchors.gameRules), on: "bottom" },
            },
        ],
    },
};