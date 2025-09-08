import type { GameDisplay } from "@/lib/types";
import { Condense } from "./Condense";
import { Contrast } from "./Contrast";
import { Synthesize } from "./Synthesize";

export const ALL_GAMES: Record<string, GameDisplay> = {
  [Condense.name]: Condense,
  [Contrast.name]: Contrast,
  [Synthesize.name]: Synthesize,
};