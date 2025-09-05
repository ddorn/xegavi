import { ALL_GAMES } from "@/components/games/games";
import type { GameDisplay } from "./types";

export function ensureIsSingleGame(results: Object[]) {

    const gameName = results[0]["game"]["game"]["name"]
    const seed = results[0]["game"]["game"]["map_seed"]

    // Check that all the results have the same game name and seed
    if (!results.every((result) => result["game"]["game"]["name"] === gameName && result["game"]["game"]["map_seed"] === seed)) {
        throw new Error("All results must have the same game name and seed")
    }
}