import type { GameDisplay } from "@/lib/types";
import { Condense } from "./Condense";

export const ALL_GAMES: Record<string, GameDisplay> = {
  [Condense.name]: Condense,
};