import useSWR from "swr";
import { loadParsedDataset } from "@/lib/dataset";
import type { GameDisplay } from "@/lib/types";
import type { RaceData } from "@/lib/barRace";

export function useDataset(url: string | null) {
  const shouldFetch = !!url;
  const { data, error, isLoading, mutate } = useSWR<{ game: GameDisplay; raceData: RaceData }>(shouldFetch ? ["dataset", url] : null, () => loadParsedDataset(url as string));
  return {
    game: data?.game ?? null,
    raceData: data?.raceData ?? null,
    isLoading: !!shouldFetch && isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: () => mutate(),
  } as const;
}

export default useDataset;