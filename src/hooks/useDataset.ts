import { useCallback, useEffect, useState } from "react";
import { ALL_GAMES } from "@/components/games/games";
import type { GameDisplay } from "@/lib/types";
import type { RaceData } from "@/lib/barRace";


type Loader = () => Promise<unknown>;


type UseDatasetResult = {
  game: GameDisplay | null;
  raceData: RaceData | null;
  error: string | null;
  onFile: (file: File) => void;
  loadFromUrl: (url: string) => void;
};


function detectGameNameFromRaw(raw: unknown): string {
  console.debug("detectGameNameFromRaw", raw);
  if (!Array.isArray(raw)) {
    throw new Error(`Expected array but got ${typeof raw}`);
  }

  if (raw.length === 0) {
    throw new Error("Array is empty");
  }

  const firstItem = raw[0];
  if (!firstItem || typeof firstItem !== 'object') {
    throw new Error(`First array item is not an object: ${typeof firstItem}`);
  }

  const gameObj = (firstItem as Record<string, unknown>)["game"];
  if (!gameObj || typeof gameObj !== 'object') {
    throw new Error("Missing or invalid 'game' property in first item");
  }

  const gameGameObj = (gameObj as Record<string, unknown>)["game"];
  if (!gameGameObj || typeof gameGameObj !== 'object') {
    throw new Error("Missing or invalid 'game.game' property");
  }

  const name = (gameGameObj as Record<string, unknown>)["name"];
  if (!name || typeof name !== 'string') {
    throw new Error("Missing or invalid 'game.game.name' property");
  }

  return name;
}

export function useDataset(): UseDatasetResult {
  const [game, setGame] = useState<UseDatasetResult["game"]>(null);
  const [raceData, setRaceData] = useState<UseDatasetResult["raceData"]>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (loader: Loader) => {
    try {
      const raw = await loader();
      const name = detectGameNameFromRaw(raw);
      if (!name) throw new Error("Failed to detect game name", { cause: raw });
      const g =  ALL_GAMES[name];
      const rd = g.barRaceData(raw);
      if (!rd) throw new Error("Failed to convert dataset to race data");
      setGame(g);
      setRaceData(rd);
      setError(null);
    } catch (e) {
      console.error(e);
      setGame(null);
      setRaceData(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onFile = useCallback((file: File) => {
    void load(async () => JSON.parse(await file.text()));
  }, [load]);

  const loadFromUrl = useCallback((url: string) => {
    void load(async () => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    });
  }, [load]);

  useEffect(() => {
    void load(async () => {
      const res = await fetch("/games/Condense_14.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    });
  }, [load]);

  return { game, raceData, error, onFile, loadFromUrl };
}