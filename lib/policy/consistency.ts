/**
 * Consistency engine — the math behind FitCore's North Star (CONSISTENCY).
 *
 * Pure + deterministic + timezone-safe (operates on YYYY-MM-DD strings in UTC). No DB, no
 * randomness — fully unit-testable. Services feed it a list of "activity dates" (any day the
 * user did *something*: workout, meal, water, weight, check-in) and a reference "today".
 *
 * Philosophy (vision §5.6): streaks here are motivating, not punitive. The current streak has a
 * one-day grace (today may not be over yet), and the comeback system (lib/policy/comeback.ts)
 * handles longer lapses warmly instead of zeroing progress in the UI.
 */

const DAY_MS = 86_400_000;

function toMs(isoDate: string): number {
  return Date.parse(isoDate.slice(0, 10) + 'T00:00:00Z');
}

function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface ConsistencyStats {
  /** Consecutive active days ending today (or yesterday, grace) — 0 if lapsed 2+ days. */
  currentStreak: number;
  /** Best consecutive active-day run ever recorded. */
  longestStreak: number;
  /** Did the user do anything today? */
  activeToday: boolean;
  /** Active days within the last 7 (inclusive of today). */
  last7: number;
  /** Active days within the last 28 (inclusive of today). */
  last28: number;
  /** last7 / 7 as a 0-100 percentage. */
  weekPct: number;
  /** last28 / 28 as a 0-100 percentage. */
  monthPct: number;
  /** Distinct active days on record. */
  totalActiveDays: number;
}

/** Build a Set of normalized YYYY-MM-DD strings from raw activity dates. */
function activeSet(activityDates: string[]): Set<string> {
  const set = new Set<string>();
  for (const d of activityDates) {
    if (typeof d === 'string' && d.length >= 10) set.add(d.slice(0, 10));
  }
  return set;
}

export function computeConsistency(activityDates: string[], today: string): ConsistencyStats {
  const active = activeSet(activityDates);
  const todayMs = toMs(today);

  // Current streak with a one-day grace: anchor on today if active, else yesterday if active.
  let currentStreak = 0;
  let anchor: number | null = null;
  if (active.has(toISO(todayMs))) anchor = todayMs;
  else if (active.has(toISO(todayMs - DAY_MS))) anchor = todayMs - DAY_MS;
  if (anchor !== null) {
    let cursor = anchor;
    while (active.has(toISO(cursor))) {
      currentStreak++;
      cursor -= DAY_MS;
    }
  }

  // Longest run across all recorded days.
  const sorted = [...active].map(toMs).sort((a, b) => a - b);
  let longestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const ms of sorted) {
    run = prev !== null && ms - prev === DAY_MS ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = ms;
  }

  // Rolling windows.
  let last7 = 0;
  let last28 = 0;
  for (let i = 0; i < 28; i++) {
    if (active.has(toISO(todayMs - i * DAY_MS))) {
      last28++;
      if (i < 7) last7++;
    }
  }

  return {
    currentStreak,
    longestStreak,
    activeToday: active.has(toISO(todayMs)),
    last7,
    last28,
    weekPct: Math.round((last7 / 7) * 100),
    monthPct: Math.round((last28 / 28) * 100),
    totalActiveDays: active.size,
  };
}

/**
 * Direction of momentum: compare active days in the last 7 vs the prior 7 (days 8–14 ago).
 * Drives coach_memory.derived.consistencyTrend and the Today momentum meter.
 */
export function computeTrend(activityDates: string[], today: string): 'up' | 'flat' | 'down' {
  const active = activeSet(activityDates);
  const todayMs = toMs(today);
  let recent = 0;
  let prior = 0;
  for (let i = 0; i < 7; i++) if (active.has(toISO(todayMs - i * DAY_MS))) recent++;
  for (let i = 7; i < 14; i++) if (active.has(toISO(todayMs - i * DAY_MS))) prior++;
  if (recent > prior) return 'up';
  if (recent < prior) return 'down';
  return 'flat';
}

/** Map a 28-day consistency percentage to a 1–5 momentum level for the UI meter. */
export function momentumLevel(monthPct: number): number {
  if (monthPct >= 80) return 5;
  if (monthPct >= 60) return 4;
  if (monthPct >= 40) return 3;
  if (monthPct >= 20) return 2;
  return 1;
}
