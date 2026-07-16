import { getCollection } from '@/lib/db/repository';
import type { MemorySignal } from '@/lib/services/memory/types';
import { computeGamification, type GamificationState } from '@/lib/policy/gamification';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Projects the user's signal stream into XP / level / badges via the pure gamification policy.
 * Stateless and always consistent with actual behavior.
 */
export const GamificationService = {
  summarizeSignals(
    rows: Pick<MemorySignal, 'type' | 'occurredAt'>[],
    today: string = todayISO(),
  ): GamificationState {
    const signalTypes = rows.map((r) => r.type);
    const activityDates = rows.map((r) => new Date(r.occurredAt).toISOString().slice(0, 10));
    return computeGamification({ signalTypes, activityDates, today });
  },

  async getSummary(clerkUserId: string): Promise<GamificationState> {
    const coll = await getCollection<MemorySignal>('memory_signals');
    const rows = await coll.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(2000).toArray();
    return this.summarizeSignals(rows);
  },
};
