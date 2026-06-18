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
  /** Distinct-ish list of activity dates (YYYY-MM-DD) from the most recent N signals. */
  async getActivityDates(clerkUserId: string, limit = 500): Promise<string[]> {
    const coll = await getCollection<MemorySignal>(SIGNALS);
    const rows = await coll.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(limit).toArray();
    return rows.map((r) => new Date(r.occurredAt).toISOString().slice(0, 10));
  },

  async getSummary(clerkUserId: string): Promise<ConsistencySummary> {
    const dates = await this.getActivityDates(clerkUserId);
    const today = todayISO();
    const stats = computeConsistency(dates, today);
    return {
      ...stats,
      trend: computeTrend(dates, today),
      momentum: momentumLevel(stats.monthPct),
    };
  },
};
