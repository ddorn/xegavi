import type { Dataset, GameDisplay, RoundDisplayProps, RoundModel } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { TokenMultilineText } from "@/components/TokenMultilineText";
import { pickTextColor } from "@/lib/colors";
import { RaceData } from "@/lib/barRace";
import { ensureIsSingleGame } from "@/lib/dataset";

function ContrastRoundDisplay({ raceData, focusedModelId, round }: RoundDisplayProps) {
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

                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Positive text:</div>
                <div data-tour="explainer-tokens">
                    <TokenMultilineText tokenScoresList={[explainerRound?.bestTokenScores?.[0] ?? []]} numLines={2} />
                </div>

                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Negative text:</div>
                <div>
                    <TokenMultilineText tokenScoresList={[explainerRound?.bestTokenScores?.[1] ?? []]} numLines={2} />
                </div>
            </div>
        </div>
    );
}

function parseContrastBenchmarkToDataset(raw: unknown): Dataset {
    ensureIsSingleGame(raw as any);

    const nModels = (raw as any).length;
    const nRounds = (raw as any)[0].game_results.length;
    const modelSet = new Set<string>();
    for (const game of (raw as any)) {
        modelSet.add(game.game.players[0].id);
    }
    if (modelSet.size !== nModels) {
        throw new Error(`Expected ${nModels} models, got ${modelSet.size}`);
    }

    const byRoundbyModel: Record<string, RoundModel>[] = Array.from({ length: nRounds }, () => ({}));
    for (const game of (raw as any)) {
        const model = game.game.players[0].id;
        for (const [roundIndex, round] of game.game_results.entries()) {
            const score = round.scores['black'];
            const move = round.xrt_history.find((e: any) => e.type === "elicit_response").response;
            const rewardEvents = round.xrt_history.filter((e: any) => e.type === "reward");
            if (rewardEvents.length !== 2) {
                throw new Error(`Contrast expects exactly 2 reward events, got ${rewardEvents.length}`);
            }
            const pos = rewardEvents[0];
            const neg = rewardEvents[1];
            if (pos.value.scale !== 1) {
                throw new Error(`Positive reward scale must be 1, got ${pos.value.scale}`);
            }
            if (neg.value.scale !== -1) {
                throw new Error(`Negative reward scale must be -1, got ${neg.value.scale}`);
            }

            const tokenScores = [pos.value.pairs, neg.value.pairs];

            byRoundbyModel[roundIndex][model] = {
                model,
                score,
                move,
                tokenScores,
            };
        }
    }

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
    return ds as any;
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
    return new RaceData(ds as any);
  },
};