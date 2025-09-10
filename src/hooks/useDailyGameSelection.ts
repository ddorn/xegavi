import { useState, useEffect, useCallback } from "react";
import useMonth from "@/hooks/useMonth";
import { formatDateUTC, formatMonthKey, getTodayUTC, parseUTCDate } from "@/lib/daily";
import { DailyMonth } from "@/lib/daily";

export interface DailyGameSelection {
  selectedGameUrl: string | null;
  selectedDateUTC: Date | null;
  selectDate: (date: Date) => void;
}

export function useDailyGameSelection(fallbackGameDate: string): DailyGameSelection {
  const [selectedGameUrl, setSelectedGameUrl] = useState<string | null>(null);
  const [selectedDateUTC, setSelectedDateUTC] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const url = new URL(window.location.href);
    const dParam = url.searchParams.get("d");
    if (dParam) {
      const parsed = parseUTCDate(dParam);
      if (parsed) return parsed;
    }
    return getTodayUTC();
  });

  const monthKey = selectedDateUTC ? formatMonthKey(selectedDateUTC) : null;
  const { month: monthData, isLoading } = useMonth(monthKey);

  const fallbackMonthKey = parseUTCDate(fallbackGameDate) ? formatMonthKey(parseUTCDate(fallbackGameDate)!) : null;
  const { month: fallbackMonthData } = useMonth(fallbackMonthKey);


  useEffect(() => {
    if (!selectedDateUTC || isLoading) return;

    const findGameUrl = (data: DailyMonth | null, date: Date): string | null => {
      return data?.[formatDateUTC(date)]?.gameUrl ?? null;
    }

    const gameUrl = findGameUrl(monthData, selectedDateUTC);
    if (gameUrl) {
      setSelectedGameUrl(gameUrl);
      return;
    }

    // If no game is found for the selected date, and the month data has loaded,
    // then we check the fallback date.
    if (!isLoading) {
      const fallbackUrl = findGameUrl(fallbackMonthData, parseUTCDate(fallbackGameDate)!);
      if (fallbackUrl) {
        setSelectedGameUrl(fallbackUrl);
      }
    }
  }, [selectedDateUTC, monthData, fallbackMonthData, isLoading, fallbackGameDate]);


  const selectDate = useCallback((date: Date) => {
    setSelectedDateUTC(date);
    const url = new URL(window.location.href);
    url.searchParams.set("d", formatDateUTC(date));
    window.history.pushState({}, "", url);
  }, []);

  return { selectedGameUrl, selectedDateUTC, selectDate };
}
