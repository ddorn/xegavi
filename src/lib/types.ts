import { z } from "zod";

export type TokenScores = Array<[string, number]>;

export type Playback = { isPlaying: boolean; round: number; speed: number };

export const RoundModelSchema = z.object({
  model: z.string(),
  nice_model: z.string(),
  company: z.string(),
  logo: z.string().optional(),
  score: z.number().finite(),
  move: z.string(),
  token_scores: z.array(z.tuple([z.string(), z.number()])),
});
export type RoundModel = z.infer<typeof RoundModelSchema>;

export const DatasetSchema = z.object({
  version: z.string(),
  rounds: z.array(z.array(RoundModelSchema)),
});
export type Dataset = z.infer<typeof DatasetSchema>;

export type HeatmapMode = "none" | "prefix" | "full" | "bottomStripe" | "overlayAligned";