"use client";

import { useMemo, useCallback } from "react";
import { getTodayUTC } from "@/lib/daily";

interface ArchiveBannerProps {
  selectedDateUTC: Date | null;
  selectDate: (date: Date) => void;
}

export function ArchiveBanner({ selectedDateUTC, selectDate }: ArchiveBannerProps) {
  const todayUTC = useMemo(() => getTodayUTC(), []);
  const isToday = selectedDateUTC?.getTime() === todayUTC.getTime();

  const handleGoToToday = useCallback(() => {
    selectDate(getTodayUTC());
  }, [selectDate]);

  if (!selectedDateUTC || isToday) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-yellow-100 p-2 text-center text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      Archive mode:{" "}
      <strong>
        {selectedDateUTC.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })}
      </strong>
      .{" "}
      <button onClick={handleGoToToday} className="underline hover:text-blue-500">
        Go to today
      </button>
    </div>
  );
}
