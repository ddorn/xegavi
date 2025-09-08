import type { Dataset, GameDisplay, RawGameResult, RoundDisplayProps } from "@/lib/types";
import { RaceData } from "@/lib/barRace";
import { MoveAndTokenSections } from "@/components/MoveAndTokenSections";
import { parseBenchmarkToDataset, getElicitEvents, getRewardEvents } from "@/lib/dataset";

function CondenseRoundDisplay({ raceData, focusedModelId, round }: RoundDisplayProps) {
    const explainerRound = focusedModelId ? raceData.roundsFor(focusedModelId)[round] : null;
    const bg = explainerRound?.color ?? "#888";

    if (!explainerRound) return <div>No data</div>;

    return (
        <MoveAndTokenSections
            model={explainerRound.model}
            move={explainerRound.bestMove}
            sections={[{ label: "Today\'s text:", tokenScoresList: explainerRound.bestTokenScores ?? [], numLines: 3 }]}
        />
    );
}

export function convertCondenseRound(round: RawGameResult) {
    const rewards = getRewardEvents(round);
    if (rewards.length !== 1) {
        throw new Error(`Condense expects exactly 1 reward event, got ${rewards.length}`);
    }
    const r = rewards[0];
    if (r.value.scale !== 1) {
        throw new Error(`Unsupported scale for reward: ${r.value.scale}`);
    }

    const elicits = getElicitEvents(round)
    if (elicits.length !== 1) {
        throw new Error(`Condense expects exactly 1 elicit event, got ${elicits.length}`);
    }
    const move = elicits[0].response;

    return { score: round.scores['black'], move, tokenScores: [r.value.pairs] };
}


function parseCondenseBenchmarkToDataset(raw: unknown): Dataset {
    return parseBenchmarkToDataset(raw, convertCondenseRound);
}

export const Condense: GameDisplay = {
  name: "Condense",
    pageTitle: "Challenge for LLMs: find a surprise-minimizing prefix for a given text.",
    subtitle: (
        <div>There are 3 rules: models have 30 attempts; prefixes are up to 10 tokens; and no words from the text can be used.</div>
    ),
    roundDisplay: (props) => <CondenseRoundDisplay {...props} />,
    barRaceData: (raw: unknown) => {
        const ds = parseCondenseBenchmarkToDataset(raw);
        return new RaceData(ds);
  },
};