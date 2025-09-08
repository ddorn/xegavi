import { z } from "zod";
import type React from "react";
import type { RaceData } from "@/lib/barRace";

export type TokenScores = Array<[string, number]>;
export type TokenScoresList = TokenScores[];

export type Playback = { isPlaying: boolean; round: number; speed: number };

export const RoundModelSchema = z.object({
  model: z.string(),
  score: z.number().finite(),
  move: z.string(),
  tokenScores: z.array(z.array(z.tuple([z.string(), z.number()]))),
});
export type RoundModel = z.infer<typeof RoundModelSchema>;

export const DatasetSchema = z.object({
  version: z.string(),
  rounds: z.array(z.array(RoundModelSchema)),
});
export type Dataset = z.infer<typeof DatasetSchema>;

export type HeatmapMode = "none" | "prefix" | "full" | "bottomStripe" | "overlayAligned";

export type RoundDisplayProps = {
  raceData: RaceData;
  focusedModelId: string | null;
  round: number;
};

export type GameDisplay = {
  name: string;
  pageTitle: string;
  subtitle: React.ReactNode;
  /// Component factory to display the round header (prefix + highlighted tokens)
  roundDisplay: (props: RoundDisplayProps) => React.ReactNode;
  barRaceData: (data: unknown) => RaceData | null;
};

// -------------------- Raw benchmark (minimal) schemas --------------------

export const ElicitResponseEventSchema = z.object({
  type: z.literal("elicit_response"),
  response: z.string(),
});
export type RawElicitResponseEvent = z.infer<typeof ElicitResponseEventSchema>;

export const RewardEventSchema = z.object({
  type: z.literal("reward"),
  value: z.object({
    scale: z.number(),
    pairs: z.array(z.tuple([z.string(), z.number()])),
  }),
});
export type RawRewardEvent = z.infer<typeof RewardEventSchema>;

// Accept any event shape, we will re-validate the ones we consume later
export const XrtEventSchema = z.object({ type: z.string() }).passthrough();
export type RawXrtEvent = z.infer<typeof XrtEventSchema>;

export const GameResultSchema = z.object({
  scores: z.record(z.string(), z.number()),
  xrt_history: z.array(XrtEventSchema),
});
export type RawGameResult = z.infer<typeof GameResultSchema>;

export const PlayerSchema = z.object({ id: z.string() });
export type RawPlayer = z.infer<typeof PlayerSchema>;

export const RawGameMetaSchema = z.object({
  name: z.string(),
  map_seed: z.union([z.string(), z.number()]),
});

export const RawGameSchema = z.object({
  game: z.object({
    game: RawGameMetaSchema,
    players: z.array(PlayerSchema),
  }),
  game_results: z.array(GameResultSchema),
});
export type RawGame = z.infer<typeof RawGameSchema>;

export const RawBenchmarkSchema = z.array(RawGameSchema);
export type RawBenchmark = z.infer<typeof RawBenchmarkSchema>;