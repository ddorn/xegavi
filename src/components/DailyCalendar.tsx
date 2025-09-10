"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { DailyMonth, DailyDay } from "@/lib/daily";
import { buildMonthGridMonday, formatDateUTC, getTodayUTC, formatMonthKey, addMonthsUTC } from "@/lib/daily";
import { modelLogoPath, deriveModelPresentation } from "@/lib/model-metadata";
import useMonth from "@/hooks/useMonth";

export type DailyCalendarProps = {
  selectedDateUTC: Date | null;
  onSelectDay: (dateUTC: Date) => void;
};

export function DailyCalendar(props: DailyCalendarProps) {
  const { onSelectDay, selectedDateUTC } = props;

  const [monthDateUTC, setMonthDateUTC] = useState<Date>(() => {
    return selectedDateUTC ? new Date(Date.UTC(selectedDateUTC.getUTCFullYear(), selectedDateUTC.getUTCMonth(), 1)) : getTodayUTC();
  });

  useEffect(() => {
    if (selectedDateUTC) {
      const newMonthDate = new Date(Date.UTC(selectedDateUTC.getUTCFullYear(), selectedDateUTC.getUTCMonth(), 1));
      if (newMonthDate.getTime() !== monthDateUTC.getTime()) {
        setMonthDateUTC(newMonthDate);
      }
    }
  }, [selectedDateUTC, monthDateUTC]);


  const monthKey = formatMonthKey(monthDateUTC);
  const { month: monthData, isLoading, error } = useMonth(monthKey);

  const grid = React.useMemo(() => buildMonthGridMonday(monthDateUTC), [monthDateUTC]);
  const month = monthDateUTC.getUTCMonth();
  const year = monthDateUTC.getUTCFullYear();
  const today = getTodayUTC();

  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const onPrevMonth = () => setMonthDateUTC(d => addMonthsUTC(d, -1));
  const onNextMonth = () => setMonthDateUTC(d => addMonthsUTC(d, 1));
  const onToday = () => {
    const t = getTodayUTC();
    setMonthDateUTC(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)));
    onSelectDay(t);
  }

  return (
    <div className="text-xs max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <button type="button" className="px-2 py-1 border rounded" onClick={onPrevMonth} aria-label="Previous month">‹</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={onToday} aria-label="Today">Today</button>
          <button type="button" className="px-2 py-1 border rounded" onClick={onNextMonth} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="text-[11px] opacity-70 mb-2">Click a past day to load its game.</div>

      {isLoading && (
        <div className="text-xs opacity-70 mb-2">Loading…</div>
      )}

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>
      )}

      <div className="grid grid-cols-7 gap-1 text-xs mb-1">
        {dow.map((d) => (
          <div key={d} className="text-center opacity-70">{d}</div>
        ))}
      </div>

      <div className="relative">
        <div className="grid grid-cols-7 gap-1">
          {grid.flat().map((date, idx) => {
            if (!date) {
              return <div key={idx} className="aspect-square" aria-hidden />;
            }
            const inMonth = date.getUTCMonth() === month && date.getUTCFullYear() === year;
            const isFuture = date.getTime() > today.getTime();
            const dateKey = formatDateUTC(date);
            const entry = monthData ? monthData[dateKey] : undefined;
            const isSelected = selectedDateUTC && formatDateUTC(selectedDateUTC) === dateKey;
            const clickable = !!entry && !isFuture && inMonth;

            const logoSrc = entry && !isFuture ? modelLogoPath(entry.bestModel) : null;
            const { niceModel } = entry ? deriveModelPresentation(entry.bestModel) : { niceModel: "" } as any;
            const ariaLabel = entry ? `${dateKey}: ${entry.gameType}. Best: ${niceModel}. Score ${entry.bestScore}` : `${dateKey}`;

            return (
              <button
                key={idx}
                type="button"
                disabled={!clickable}
                aria-label={ariaLabel}
                onClick={() => entry && onSelectDay(date)}
                title={entry ? `${entry.gameType} — ${niceModel} (${entry.bestScore})` : undefined}
                className={[
                  "aspect-square rounded border p-1 flex flex-col ",
                  inMonth ? "" : "opacity-40",
                  isSelected ? "ring-2 ring-blue-500" : "",
                  clickable ? "hover:bg-blue-50 dark:hover:bg-neutral-800 cursor-pointer" : "cursor-default",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="text-[10px] opacity-70">{date.getUTCDate()}</div>
                  {/* Game name top-right on md+, hidden on mobile */}
                  {entry && !isFuture && (
                    <div className="text-[10px] opacity-70 hidden md:block">{entry.gameType}</div>
                  )}
                </div>
                {!isFuture && (
                  <div className="flex my-auto flex flex-col items-center justify-center gap-1 ">
                    {entry && logoSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoSrc} alt="" className="h-6 w-6 md:h-7 md:w-7" />
                    )}
                    {entry && (
                      <div className="text-[12px] md:text-[12px] font-bold text-center leading-tight">
                        {niceModel}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DailyCalendar;
