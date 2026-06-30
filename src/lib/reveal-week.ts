/**
 * Reveal week helpers — a "reveal" in HappyOur has no table: it is the set of
 * captures (photos rows) whose `created_at` falls in a weekly window running
 * from Sunday 20:00 to Sunday 20:00 in Europe/Paris (app_config reveal_day=0,
 * reveal_hour=20). These pure helpers mirror the app's getWeekBounds logic and
 * are safe to import from both server and client code.
 *
 * DST-correct: Sunday 20:00 Paris is 18:00 UTC in summer (CEST) and 19:00 UTC
 * in winter (CET). We derive the offset via Intl instead of a fixed value.
 */

const PARIS = "Europe/Paris";
const REVEAL_HOUR = 20;

function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) if (p.type !== "literal") m[p.type] = p.value;
  const hour = m.hour === "24" ? 0 : Number(m.hour);
  const asUTC = Date.UTC(
    Number(m.year),
    Number(m.month) - 1,
    Number(m.day),
    hour,
    Number(m.minute),
    Number(m.second)
  );
  return asUTC - date.getTime();
}

/** Interpret a Paris wall-clock datetime (month is 1-12) as a real UTC instant. */
function parisWallClockToUtc(
  y: number,
  mo1: number,
  day: number,
  hour: number,
  min: number
): Date {
  const naive = Date.UTC(y, mo1 - 1, day, hour, min, 0);
  const offset = tzOffsetMs(new Date(naive), PARIS);
  return new Date(naive - offset);
}

/** Read the Paris wall-clock components of a UTC instant. */
function parisParts(date: Date): {
  y: number;
  mo: number;
  day: number;
  hour: number;
  minute: number;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) if (p.type !== "literal") m[p.type] = p.value;
  const hour = m.hour === "24" ? 0 : Number(m.hour);
  return {
    y: Number(m.year),
    mo: Number(m.month),
    day: Number(m.day),
    hour,
    minute: Number(m.minute),
  };
}

/** Most recent Sunday 20:00 Europe/Paris at or before `date`, as a UTC instant. */
export function getRevealWeekStart(date: Date): Date {
  const { y, mo, day } = parisParts(date);
  // Weekday of that calendar date (0 = Sunday), independent of timezone.
  const weekday = new Date(Date.UTC(y, mo - 1, day)).getUTCDay();
  const sunday = new Date(Date.UTC(y, mo - 1, day - weekday));
  const boundary = parisWallClockToUtc(
    sunday.getUTCFullYear(),
    sunday.getUTCMonth() + 1,
    sunday.getUTCDate(),
    REVEAL_HOUR,
    0
  );
  if (date.getTime() >= boundary.getTime()) return boundary;
  const prev = new Date(Date.UTC(y, mo - 1, day - weekday - 7));
  return parisWallClockToUtc(
    prev.getUTCFullYear(),
    prev.getUTCMonth() + 1,
    prev.getUTCDate(),
    REVEAL_HOUR,
    0
  );
}

/** End of a reveal week (= next Sunday 20:00 Paris), DST-correct. */
export function getRevealWeekEnd(weekStart: Date): Date {
  const p = parisParts(weekStart);
  return parisWallClockToUtc(p.y, p.mo, p.day + 7, REVEAL_HOUR, 0);
}

/**
 * Shift an instant by N reveal-weeks while preserving the Paris wall-clock
 * (same weekday + same local time), correcting for any DST change crossed.
 */
export function shiftByWeeks(date: Date, weeks: number): Date {
  const naive = new Date(date.getTime() + weeks * 7 * 24 * 3600 * 1000);
  const srcOff = tzOffsetMs(date, PARIS);
  const dstOff = tzOffsetMs(naive, PARIS);
  return new Date(naive.getTime() + (srcOff - dstOff));
}

/**
 * The app keys weekly challenges by the Monday (Paris) date string of the
 * calendar week (lib/challenges.ts getChallengeWeekStart). Derive it from a
 * reveal week start (Sunday 20:00) using a mid-week date to avoid the
 * Sunday-evening edge.
 */
export function challengeWeekStartForReveal(revealWeekStart: Date): string {
  const mid = new Date(revealWeekStart.getTime() + 2 * 24 * 3600 * 1000); // ~Tuesday
  const p = parisParts(mid);
  const weekday = new Date(Date.UTC(p.y, p.mo - 1, p.day)).getUTCDay(); // 0=Sun
  const back = weekday === 0 ? 6 : weekday - 1;
  const mondayCal = new Date(Date.UTC(p.y, p.mo - 1, p.day - back));
  // Mirror the app's getChallengeWeekStart EXACTLY: it takes Monday at *Paris*
  // local midnight and serializes with toISOString(), which in CEST (UTC+2)
  // yields the *Sunday* date string (e.g. "2026-06-28").
  const mondayMidnight = parisWallClockToUtc(
    mondayCal.getUTCFullYear(),
    mondayCal.getUTCMonth() + 1,
    mondayCal.getUTCDate(),
    0,
    0
  );
  return mondayMidnight.toISOString().slice(0, 10);
}

/** Inverse of challengeWeekStartForReveal: stored week_start string -> reveal week start. */
export function revealWeekStartForChallengeWeek(weekStart: string): Date {
  const base = new Date(`${weekStart}T00:00:00Z`);
  // Land safely mid-week (Mon/Tue Paris) then snap to the reveal week.
  return getRevealWeekStart(new Date(base.getTime() + 36 * 3600 * 1000));
}

const weekFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS,
  weekday: "short",
  day: "numeric",
  month: "short",
});

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** e.g. "Dim 8 juin 20h → Dim 15 juin 20h" */
export function formatRevealWeekLabel(weekStart: Date): string {
  const end = getRevealWeekEnd(weekStart);
  const a = cap(weekFmt.format(weekStart).replace(/\./g, ""));
  const b = cap(weekFmt.format(end).replace(/\./g, ""));
  return `${a} 20h → ${b} 20h`;
}

export interface WeekBucket<T> {
  key: string;
  weekStart: Date;
  label: string;
  items: T[];
}

/** Group items into reveal weeks, sorted from most recent to oldest. */
export function bucketByWeek<T>(items: T[], getDate: (t: T) => string | Date): WeekBucket<T>[] {
  const map = new Map<string, WeekBucket<T>>();
  for (const it of items) {
    const ws = getRevealWeekStart(new Date(getDate(it)));
    const key = ws.toISOString();
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { key, weekStart: ws, label: formatRevealWeekLabel(ws), items: [] };
      map.set(key, bucket);
    }
    bucket.items.push(it);
  }
  return [...map.values()].sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
}

const pad = (n: number) => String(n).padStart(2, "0");

/** UTC instant -> value for <input type="datetime-local"> shown in Paris time. */
export function utcToParisInputValue(date: Date): string {
  const p = parisParts(date);
  return `${p.y}-${pad(p.mo)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** <input type="datetime-local"> value (Paris wall-clock) -> UTC instant. */
export function parisInputValueToUtc(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, mo, day] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  return parisWallClockToUtc(y, mo, day, h, mi);
}

/** Short Paris time label, e.g. "dim. 14:32". */
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PARIS,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatParisTime(date: string | Date): string {
  return timeFmt.format(new Date(date));
}
