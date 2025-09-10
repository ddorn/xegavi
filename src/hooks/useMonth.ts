import useSWR from "swr";
import { getMonth } from "@/lib/dataset";
import type { DailyMonth } from "@/lib/daily";

export function useMonth(monthKey: string | null) {
  const shouldFetch = !!monthKey;
  const { data, error, isLoading, mutate } = useSWR<DailyMonth>(shouldFetch ? ["month", monthKey] : null, () => getMonth(monthKey as string));
  return {
    month: data ?? null,
    isLoading: !!shouldFetch && isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: () => mutate(),
  } as const;
}

export default useMonth;
