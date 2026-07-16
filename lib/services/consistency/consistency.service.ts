import { getCollection } from '@/lib/db/repository';
import type { MemorySignal } from '@/lib/services/memory/types';
import {
  computeConsistency,
  computeTrend,
  momentumLevel,
  type ConsistencyStats,
} from '@/lib/policy/consistency';

const SIGNALS = 'memory_signals';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ConsistencySummary extends ConsistencyStats {
  trend: 'up' | 'flat' | 'down';
  momentum: number; // 1..5
}

/**
 * Reads the unified activity stream (memory_signals — populated by every log, workout
 * completion, check-in across app/WhatsApp/voice) and projects it through the pure consistency
 * policy. This is the single source of truth for streaks + consistency % surfaced on Today,
 * Progress, and the coach.
 */
export const ConsistencyService = {
  /** Recent raw activity signals, sorted newest first. Lets composite endpoints reuse one read. */
  async getActivitySignals(clerkUserId: string, limit = 500): Promise<MemorySignal[]> {
    const coll = await getCollection<MemorySignal>(SIGNALS);
    const rows = await coll.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(limit).toArray();
    return rows as MemorySignal[];
  },

  activityDatesFromSignals(rows: Pick<MemorySignal, 'occurredAt'>[]): string[] {
    return rows.map((r) => new Date(r.occurredAt).toISOString().slice(0, 10));
  },

  /** Distinct-ish list of activity dates (YYYY-MM-DD) from the most recent N signals. */
  async getActivityDates(clerkUserId: string, limit = 500): Promise<string[]> {
    return this.activityDatesFromSignals(await this.getActivitySignals(clerkUserId, limit));
  },

  /** Pure projection — no DB. Lets callers that already hold the dates avoid a second query. */
  summarize(dates: string[], today: string = todayISO()): ConsistencySummary {
    const stats = computeConsistency(dates, today);
    return {
      ...stats,
      trend: computeTrend(dates, today),
      momentum: momentumLevel(stats.monthPct),
    };
  },

  async getSummary(clerkUserId: string): Promise<ConsistencySummary> {
    return this.summarize(await this.getActivityDates(clerkUserId));
  },
};
