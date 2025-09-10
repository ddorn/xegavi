"use client";

import React from "react";
import type { DailyMonth, DailyDay } from "@/lib/daily";
import { buildMonthGridMonday, formatDateUTC, getTodayUTC } from "@/lib/daily";
import { modelLogoPath, deriveModelPresentation } from "@/lib/model-metadata";

export type DailyCalendarProps = {
  monthDateUTC: Date; // any date within the month (UTC)
  monthData: DailyMonth | null;
  hasMonthData: boolean; // true if file exists (even if empty)
  isLoading: boolean;
  error: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;
  onSelectDay: (dateUTC: Date, meta: DailyDay) => void;
  selectedDateUTC: Date | null;
};

export function DailyCalendar(props: DailyCalendarProps) {
  const { monthDateUTC, monthData, hasMonthData, isLoading, error, onPrevMonth, onNextMonth, onToday, onSelectDay, selectedDateUTC } = props;
  const grid = React.useMemo(() => buildMonthGridMonday(monthDateUTC), [monthDateUTC]);
  const month = monthDateUTC.getUTCMonth();
  const year = monthDateUTC.getUTCFullYear();
  const today = getTodayUTC();
  const monthLabel = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));

  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="mt-6 border rounded-md p-2 text-xs max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">Winners of {monthLabel}</div>
        <div className="flex items-center gap-1">
          <button type="button" className="px-2 py-1 border rounded" onClick={onPrevMonth} aria-label="Previous month">‹</button>
          {onToday && (
            <button type="button" className="px-2 py-1 border rounded" onClick={onToday} aria-label="Today">Today</button>
          )}
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
              onClick={() => entry && onSelectDay(date, entry)}
              title={entry ? `${entry.gameType} — ${niceModel} (${entry.bestScore})` : undefined}
              className={[
                "aspect-square rounded border p-1 relative flex flex-col",
                inMonth ? "" : "opacity-40",
                isSelected ? "ring-2 ring-blue-500" : "",
                clickable ? "hover:bg-blue-50 dark:hover:bg-neutral-800 cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              <div className="absolute top-1 left-1 text-[10px] opacity-70">{date.getUTCDate()}</div>
              {/* Game name top-right on md+, hidden on mobile */}
              {entry && !isFuture && (
                <div className="absolute top-1 right-1 text-[10px] opacity-70 hidden md:block">{entry.gameType}</div>
              )}
              {!isFuture && (
                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                  {entry && logoSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt="" className="h-6 w-6 md:h-8 md:w-8" />
                  )}
                  {entry && (
                    <div className="text-[12px] md:text-[13px] font-bold text-center leading-tight">
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
  );
}

export default DailyCalendar;
