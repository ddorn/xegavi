"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DailyCalendar from "@/components/DailyCalendar";
import { DailyMonthSchema, DailyDay, formatDateUTC, formatMonthKey, getTodayUTC, parseUTCDate, addMonthsUTC } from "@/lib/daily";
import useMonth from "@/hooks/useMonth";

export type DailyArchiveProps = {
  onSelectGameUrl: (url: string) => void;
};

export default function DailyArchive(props: DailyArchiveProps) {
  const { onSelectGameUrl } = props;

  const [selectedDateUTC, setSelectedDateUTC] = useState<Date | null>(null);
  const [monthDateUTC, setMonthDateUTC] = useState<Date>(() => getTodayUTC());
  const monthKey = formatMonthKey(monthDateUTC);
  const { month: monthData, isLoading, error } = useMonth(monthKey);

  // initial date from URL or today (UTC), clamp future to today
  useEffect(() => {
    const today = getTodayUTC();
    const url = new URL(window.location.href);
    const dParam = url.searchParams.get("d");
    let initial: Date | null = null;
    if (dParam) {
      const parsed = parseUTCDate(dParam);
      if (parsed) {
        if (parsed.getTime() > today.getTime()) {
          initial = today;
          url.searchParams.delete("d");
          window.history.replaceState({}, "", url);
        } else initial = parsed;
      } else initial = today;
    } else initial = today;
    setSelectedDateUTC(initial);
    setMonthDateUTC(new Date(Date.UTC(initial.getUTCFullYear(), initial.getUTCMonth(), 1)));
  }, []);

  // Hook already loads month; nothing else here

  // Resolve selection and load dataset according to rules with hard fallback
  useEffect(() => {
    const run = async () => {
      if (!selectedDateUTC) return;
      const today = getTodayUTC();
      const selMonthKey = formatMonthKey(selectedDateUTC);
      if (selMonthKey !== monthKey) {
        setMonthDateUTC(new Date(Date.UTC(selectedDateUTC.getUTCFullYear(), selectedDateUTC.getUTCMonth(), 1)));
        return; // wait for correct month to load
      }
      if (!monthData) return; // wait until month loads

      let entry: DailyDay | undefined = monthData[formatDateUTC(selectedDateUTC)];
      if (!entry) {
        const candidates = Object.keys(monthData)
          .filter((k) => parseUTCDate(k)!.getTime() <= today.getTime())
          .sort();
        const last = candidates[candidates.length - 1];
        if (last) {
          entry = monthData[last];
          setSelectedDateUTC(parseUTCDate(last));
        }
        if (!entry) {
          const hard = parseUTCDate("2025-09-05")!;
          setSelectedDateUTC(hard);
          setMonthDateUTC(new Date(Date.UTC(hard.getUTCFullYear(), hard.getUTCMonth(), 1)));
          return; // will rerun when month loads
        }
      }
      if (!entry) return;
      onSelectGameUrl(entry.gameUrl);
    };
    void run();
  }, [selectedDateUTC, monthData, monthKey, onSelectGameUrl]);
  const hasMonthData = !!monthData;

  const hasAnyDataThisMonth = useMemo(() => {
    const md = monthData;
    if (!md) return false;
    const today = getTodayUTC();
    return Object.keys(md).some((k) => parseUTCDate(k)!.getTime() <= today.getTime());
  }, [monthData]);

  return (
    <div className="relative">
      {/* Overlay for no data this month */}
      {hasMonthData && !hasAnyDataThisMonth && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-black/50">
          <div className="border rounded-md bg-white dark:bg-neutral-900 p-3 text-sm shadow">
            <div className="mb-2">No data this month.</div>
            <div className="text-right">
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => {
                  const t = getTodayUTC();
                  setSelectedDateUTC(t);
                  setMonthDateUTC(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)));
                }}
              >Today</button>
            </div>
          </div>
        </div>
      )}

      <DailyCalendar
        monthDateUTC={monthDateUTC}
        monthData={monthData}
        hasMonthData={hasMonthData}
        isLoading={isLoading}
        error={error}
        onPrevMonth={() => setMonthDateUTC((d) => addMonthsUTC(d, -1))}
        onNextMonth={() => setMonthDateUTC((d) => addMonthsUTC(d, 1))}
        onToday={() => {
          const t = getTodayUTC();
          setSelectedDateUTC(t);
          setMonthDateUTC(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)));
        }}
        selectedDateUTC={selectedDateUTC}
        onSelectDay={(dateUTC, meta) => {
          setSelectedDateUTC(dateUTC);
          const url = new URL(window.location.href);
          url.searchParams.set("d", formatDateUTC(dateUTC));
          window.history.pushState({}, "", url);
          onSelectGameUrl(meta.gameUrl);
        }}
      />
    </div>
  );
}
