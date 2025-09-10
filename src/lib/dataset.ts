import type { RawElicitResponseEvent } from "./types";
import { DatasetSchema, type Dataset, type RawBenchmark, RawBenchmarkSchema, type RawRewardEvent, type TokenScoresList, ElicitResponseEventSchema, RewardEventSchema, type RawGameResult } from "./types";
import { DailyMonthSchema, type DailyMonth } from "@/lib/daily";
import { ALL_GAMES } from "@/components/games/games";
import type { GameDisplay } from "@/lib/types";

export function ensureIsSingleGame(results: RawBenchmark) {

    const gameName = results[0].game.game.name
    const seed = results[0].game.game.map_seed

    // Check that all the results have the same game name and seed
    if (!results.every((result) => result.game.game.name === gameName && result.game.game.map_seed === seed)) {
        throw new Error("All results must have the same game name and seed")
    }
}

// Strategy: build round data (except model) from a raw game_result
export type RoundBuild = { score: number; move: string; tokenScores: TokenScoresList };
export type RoundConversionStrategy = (round: RawGameResult) => RoundBuild;

export function parseBenchmarkToDataset(raw: unknown, convertRound: RoundConversionStrategy): Dataset {
    const parsed = RawBenchmarkSchema.parse(raw);
    ensureIsSingleGame(parsed);

    const nModels = parsed.length;
    const nRounds = parsed[0].game_results.length;

    const modelSet = new Set<string>();
    for (const game of parsed) {
        modelSet.add(game.game.players[0].id);
    }
    if (modelSet.size !== nModels) {
        throw new Error(`Expected ${nModels} models, got ${modelSet.size}`);
    }

    type RoundMap = Record<string, { model: string; score: number; move: string; tokenScores: TokenScoresList; }>;
    const byRoundByModel: RoundMap[] = Array.from({ length: nRounds }, () => ({} as RoundMap));

    for (const game of parsed) {
        const model = game.game.players[0].id;
        for (const [roundIndex, rawRound] of game.game_results.entries()) {
            byRoundByModel[roundIndex][model] = { model, ...convertRound(rawRound) };
        }
    }

    const models = Array.from(modelSet);
    for (const round of byRoundByModel) {
        for (const model of models) {
            if (!(model in round)) {
                throw new Error(`Round has no model ${model}`);
            }
        }
        if (Object.keys(round).length !== models.length) {
            throw new Error(`Round has ${Object.keys(round).length} models, expected ${models.length}`);
        }
    }

    const ds: Dataset = DatasetSchema.parse({
        version: "0.1.0",
        rounds: byRoundByModel.map(round => Object.values(round)),
    });
    return ds;
}

export function getRewardEvents(round: RawGameResult): RawRewardEvent[] {
    return round.xrt_history.filter((e) => e.type === "reward").map((e) => RewardEventSchema.parse(e));
}

export function getElicitEvents(round: RawGameResult): RawElicitResponseEvent[] {
    return round.xrt_history.filter((e) => e.type === "elicit_response").map((e) => ElicitResponseEventSchema.parse(e));
}

// ---------------- High-level fetchers ----------------

export async function getMonth(monthKey: string): Promise<DailyMonth> {
    const res = await fetch(`/daily/${monthKey}.json`, { cache: "force-cache" });
    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return DailyMonthSchema.parse(json);
}

export async function getDataset(url: string): Promise<RawBenchmark> {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
    }
    return RawBenchmarkSchema.parse(await res.json());
}

export function parseDataset(raw: RawBenchmark): { game: GameDisplay; raceData: import("./barRace").RaceData } {
    // Determine game name from raw input (first entry)
    const gameName = raw[0]?.game?.game?.name;
    if (!gameName || typeof gameName !== "string") {
        throw new Error("Invalid dataset: cannot infer game name");
    }
    const game = ALL_GAMES[gameName];
    if (!game) throw new Error(`Unknown game '${gameName}'`);
    const rd = game.barRaceData(raw);
    if (!rd) throw new Error("Failed to convert dataset to race data");
    return { game, raceData: rd };
}

export async function loadParsedDataset(url: string): Promise<{ game: GameDisplay; raceData: import("./barRace").RaceData }> {
    const raw = await getDataset(url);
    return parseDataset(raw);
}