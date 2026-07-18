import { getCollection } from '@/lib/db/repository';
import type { MemorySignal } from '@/lib/services/memory/types';
import { computeGamification, type GamificationState } from '@/lib/policy/gamification';

/**
 * Projects the user's signal stream into XP / level / badges via the pure gamification policy.
 * Stateless and always consistent with actual behavior.
 */
export const GamificationService = {
  async getSummary(clerkUserId: string): Promise<GamificationState> {
    const coll = await getCollection<MemorySignal>('memory_signals');
    const rows = await coll.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(2000).toArray();
    const signalTypes = rows.map((r) => r.type);
    const activityDates = rows.map((r) => new Date(r.occurredAt).toISOString().slice(0, 10));
    const today = new Date().toISOString().slice(0, 10);
    const events = rows.map((row) => ({ type: row.type, occurredAt: row.occurredAt, payload: row.payload }));
    return computeGamification({ signalTypes, activityDates, today, events });
  },
};
