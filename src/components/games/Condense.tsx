import type { Dataset, GameDisplay, RoundDisplayProps, RoundModel } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { TokenMultilineText } from "@/components/TokenMultilineText";
import { pickTextColor } from "@/lib/colors";
import { RaceData } from "@/lib/barRace";
import { ensureIsSingleGame } from "@/lib/dataset";

function CondenseRoundDisplay({ raceData, focusedModelId, round }: RoundDisplayProps) {
    const explainerRound = focusedModelId ? raceData.roundsFor(focusedModelId)[round] : null;
    const bg = explainerRound?.color ?? "#888";
    const fg = pickTextColor(bg);

    return (
        <div className="flex">
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-baseline gap-x-2 gap-y-2 mb-2">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Prefix:</div>
                <div>
                    <Logo model={explainerRound?.model ?? ""} className="inline-block align-middle mr-1" size={20} />
                    <span className="px-2 mr-1 items-center align-middle" style={{ color: fg, backgroundColor: bg }}>
                        <span className="font-black mr-2">{explainerRound?.niceModel ?? explainerRound?.model}</span>
                        <span className="overflow-scroll" data-tour="explainer-move">{explainerRound?.bestMove}</span>
                    </span>
                </div>

                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Today&apos;s text:</div>
                <div data-tour="explainer-tokens">
                    <TokenMultilineText tokenScores={explainerRound?.bestTokenScores ?? []} numLines={3} />
                </div>
            </div>
        </div>
    );
}

function parseCondenseBenchmarkToDataset(raw: unknown): Dataset {
    ensureIsSingleGame(raw);
    // Dataset is a list of Games, one per model
    // Games are {game, game_results, scores}
    // game_result is a list of {score, xrt_history}
    // xrt_history is a list of xegaevent

    const nModels = raw.length;
    const nRounds = raw[0].game_results.length;
    const modelSet = new Set<string>();
    for (const game of raw) {
        modelSet.add(game.game.players[0].id);
    }
    if (modelSet.size !== nModels) {
        throw new Error(`Expected ${nModels} models, got ${modelSet.size}`);
    }


    const byRoundbyModel: Record<string, RoundModel>[] = Array.from({ length: nRounds }, () => ({}));
    for (const game of raw) {
        const model = game.game.players[0].id
        for (const [roundIndex, round] of game.game_results.entries()) {
            const score = round.scores['black'];
            const move = round.xrt_history.find((e: any) => e.type === "elicit_response").response;
            const rewardEvent = round.xrt_history.find((e: any) => e.type === "reward");
            const tokenScores = rewardEvent.value.pairs
            const scale = rewardEvent.value.scale
            if (scale != 1) {
                throw new Error(`Unsupported scale for reward: ${scale}`);
            }

            byRoundbyModel[roundIndex][model] = {
                model,
                score,
                move,
                token_scores: tokenScores,
            }
        }
    }

    // Check that all the rounds have the same models names (records have the same keys, which are modelSet)
    const models = Array.from(modelSet);
    for (const round of byRoundbyModel) {
        for (const model of models) {
            if (!round[model]) {
                throw new Error(`Round ${round} has no model ${model}`);
            }
        }
        if (Object.keys(round).length !== models.length) {
            throw new Error(`Round ${round} has ${Object.keys(round).length} models, expected ${models.length}`);
        }
    }

    const ds = {
        version: "0.1.0",
        rounds: byRoundbyModel.map(round => Object.values(round)),
    };
    return ds;
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
        return new RaceData(ds as any);
  },
};