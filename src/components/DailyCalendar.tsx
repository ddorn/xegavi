"use client";

import React, { useState } from "react";
import type { DailyDay } from "@/lib/daily";
import { buildMonthGridMonday, formatDateUTC, getTodayUTC, formatMonthKey, addMonthsUTC } from "@/lib/daily";
import { deriveModelPresentation } from "@/lib/model-metadata";
import useMonth from "@/hooks/useMonth";
import { Logo } from "./Logo";

export type DailyCalendarProps = {
  selectedDateUTC: Date | null;
  onSelectDay: (dateUTC: Date) => void;
  className?: string;
};

type DayProps = {
  date: Date;
  entry: DailyDay | undefined;
  selectedDateUTC: Date | null;
  onSelectDay: (dateUTC: Date) => void;
  currentMonth: number;
  currentYear: number;
  today: Date;
  tomorrow: Date;
};

function Day({ date, entry, selectedDateUTC, onSelectDay, currentMonth, currentYear, today, tomorrow }: DayProps) {
  const inMonth = date.getUTCMonth() === currentMonth && date.getUTCFullYear() === currentYear;
  const isFuture = date.getTime() > today.getTime();
  const isTomorrow = inMonth && date.getTime() === tomorrow.getTime();
  const dateKey = formatDateUTC(date);
  const isSelected = selectedDateUTC && formatDateUTC(selectedDateUTC) === dateKey;
  const clickable = !!entry && !isFuture && inMonth;

  const { niceModel } = entry ? deriveModelPresentation(entry.bestModel) : { niceModel: "" };
  const ariaLabel = entry ? `${dateKey}: ${entry.gameType}. Best: ${niceModel}. Score ${entry.bestScore}` : `${dateKey}`;

  return (
    <button
      type="button"
      disabled={!clickable}
      aria-label={ariaLabel}
      onClick={() => entry && onSelectDay(date)}
      title={entry ? `${entry.gameType} — ${niceModel} (${entry.bestScore})` : undefined}
      className={[
        "aspect-square relative rounded border p-1 flex flex-col overflow-hidden",
        inMonth ? "" : "opacity-40",
        isSelected ? "ring-2 ring-blue-500" : "",
        clickable ? "hover:bg-blue-50 dark:hover:bg-neutral-800 cursor-pointer" : "cursor-default",
      ].join(" ")}
    >
      <div className="absolute top-0 left-0 md:relative w-full p-1 md:p-0 flex items-center justify-between gap-1 text-[0.625rem] opacity-70">
        <div>{date.getUTCDate()}</div>
        {/* Game name top-right on md+, hidden on mobile */}
        {entry && !isFuture && (
          <div className="hidden md:block">{entry.gameType}</div>
        )}
      </div>
      {!isFuture && (
        <div className="flex my-auto flex-col items-center justify-center gap-1 ">
          {entry && (
            <Logo model={entry.bestModel} className="h-6 w-6 md:h-7 md:w-7" />
          )}
          {entry && (
            <div className="text-[10px] md:text-sm font-bold text-center leading-tight">
              {niceModel}
            </div>
          )}
        </div>
      )}
      {isTomorrow && (
        <div className="my-auto flex flex-col items-center justify-center">
          <div className="text-sm md:text-base">👀</div>
          <div className="text-[10px] md:text-sm opacity-70">
            Come back tomorrow!
          </div>
        </div>
      )}
    </button>
  );
}

export function DailyCalendar({ selectedDateUTC, onSelectDay, className = "" }: DailyCalendarProps) {

  const [monthDateUTC, setMonthDateUTC] = useState<Date>(() => {
    return selectedDateUTC ? new Date(Date.UTC(selectedDateUTC.getUTCFullYear(), selectedDateUTC.getUTCMonth(), 1)) : getTodayUTC();
  });

  const monthKey = formatMonthKey(monthDateUTC);
  const { month: monthData, isLoading, error } = useMonth(monthKey);

  const grid = React.useMemo(() => buildMonthGridMonday(monthDateUTC), [monthDateUTC]);
  const month = monthDateUTC.getUTCMonth();
  const year = monthDateUTC.getUTCFullYear();
  const today = getTodayUTC();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const isNextMonthDisallowed = monthDateUTC.getUTCFullYear() > today.getUTCFullYear() ||
    (monthDateUTC.getUTCFullYear() === today.getUTCFullYear() && monthDateUTC.getUTCMonth() >= today.getUTCMonth());

  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const onPrevMonth = () => setMonthDateUTC(d => addMonthsUTC(d, -1));
  const onNextMonth = () => setMonthDateUTC(d => addMonthsUTC(d, 1));
  const onToday = () => {
    const t = getTodayUTC();
    setMonthDateUTC(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)));
    onSelectDay(t);
  };

  return (
    <div className={"" + className}>
      <div className="flex items-center justify-center gap-1 mb-2 mr-auto">
        <button type="button" className="button" onClick={onPrevMonth} aria-label="Previous month">‹</button>
        <button type="button" className="button" onClick={onToday} aria-label="Today">Today</button>
        <button type="button" className="button" onClick={onNextMonth} aria-label="Next month" disabled={isNextMonthDisallowed}>›</button>
      </div>

      {isLoading && (
        <div className="text-xs opacity-70 mb-2">Loading…</div>
      )}

      <div className="grid grid-cols-7 gap-1 text-xs mb-1">
        {dow.map((d) => (
          <div key={d} className="text-center opacity-70">{d}</div>
        ))}
      </div>

      <div className="relative">
        {error && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 flex flex-col items-center justify-center z-10 rounded">
            <p className="mb-4 text-center">No data for {monthDateUTC.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}.</p>
            <button type="button" className="button" onClick={onToday}>Go to Today</button>
          </div>
        )}
        <div className={`grid grid-cols-[repeat(7,minmax(60px,1fr))] gap-1 ${error ? "opacity-30" : ""}`}>
          {grid.flat().map((date, idx) => {
            const entry = date && monthData ? monthData[formatDateUTC(date)] : undefined;
            return (
              <Day
                key={idx}
                date={date}
                entry={entry}
                selectedDateUTC={selectedDateUTC}
                onSelectDay={onSelectDay}
                currentMonth={month}
                currentYear={year}
                today={today}
                tomorrow={tomorrow}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DailyCalendar;
