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