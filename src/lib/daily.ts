import { z } from "zod";
import { deriveModelPresentation } from "@/lib/model-metadata";

export const DailyDaySchema = z.object({
  gameId: z.string(),
  gameUrl: z.string(),
  gameType: z.string(),
  bestModel: z.string(),
  bestScore: z.number().finite(),
});
export type DailyDay = z.infer<typeof DailyDaySchema>;

export const DailyMonthSchema = z.record(z.string(), DailyDaySchema);
export type DailyMonth = z.infer<typeof DailyMonthSchema>;

export function parseUTCDate(value: string): Date | null {
  const m = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!m) return null;
  const [y, mo, d] = value.split("-").map((v) => parseInt(v, 10));
  if (!y || !mo || !d) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

export function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function isFutureUTC(date: Date, todayUTC: Date = getTodayUTC()): boolean {
  return date.getTime() > todayUTC.getTime();
}

export function addMonthsUTC(date: Date, delta: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const target = new Date(Date.UTC(y, m + delta, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day));
}

// Build a Monday-start grid for the month
export function buildMonthGridMonday(date: Date): Array<Array<Date | null>> {
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  const firstWeekdayMon0 = (first.getUTCDay() + 6) % 7; // 0 = Monday

  const grid: Array<Array<Date | null>> = [];
  let current = new Date(first);
  current.setUTCDate(current.getUTCDate() - firstWeekdayMon0);

  // 6 weeks to cover all cases
  for (let w = 0; w < 6; w++) {
    const week: Array<Date | null> = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

export function dayMetaLabel(day: DailyDay): string {
  const p = deriveModelPresentation(day.bestModel);
  return `${day.gameType}. Best: ${p.niceModel}. Score ${day.bestScore}`;
}

export function startOfWeekMondayUTC(date: Date): Date {
  const day = (date.getUTCDay() + 6) % 7; // 0=Mon
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - day);
  return start;
}

export function buildFourWeekGridEnding(endDateUTC: Date): Array<Array<Date>> {
  const endWeekStart = startOfWeekMondayUTC(endDateUTC);
  const start = new Date(endWeekStart);
  start.setUTCDate(start.getUTCDate() - 21); // 3 weeks earlier → total 4 weeks
  const grid: Array<Array<Date>> = [];
  const cur = new Date(start);
  for (let w = 0; w < 4; w++) {
    const week: Array<Date> = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

export function enumerateMonthsInRange(startUTC: Date, endUTC: Date): Array<Date> {
  const months: Array<Date> = [];
  const startKey = formatMonthKey(startUTC);
  const endKey = formatMonthKey(endUTC);
  if (startKey === endKey) return [new Date(Date.UTC(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), 1))];
  months.push(new Date(Date.UTC(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), 1)));
  months.push(new Date(Date.UTC(endUTC.getUTCFullYear(), endUTC.getUTCMonth(), 1)));
  return months;
}
