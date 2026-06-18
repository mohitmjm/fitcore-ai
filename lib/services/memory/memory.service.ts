import type { UpdateFilter } from 'mongodb';
import { getCollection } from '@/lib/db/repository';
import { computeConsistency, computeTrend } from '@/lib/policy/consistency';
import type { CoachMemory, MemorySignal } from './types';

const SIGNALS = 'memory_signals';
const MEMORY = 'coach_memory';

/**
 * Coach Memory service (Phase 1). Signal ingestion + memory access + context updates + a
 * deterministic Coach Brief projection. The reflection/compaction job and semantic recall are
 * added later. See docs/architecture/02-coach-memory-architecture.md.
 */
export const MemoryService = {
  /** Record a raw behavioral signal. Called by every domain service (app + WhatsApp + voice). */
  async recordSignal(input: Omit<MemorySignal, '_id' | 'processed' | 'createdAt'>): Promise<void> {
    const coll = await getCollection<MemorySignal>(SIGNALS);
    await coll.insertOne({ ...input, processed: false, createdAt: new Date() } as MemorySignal);
  },

  /** Create the memory shell for a user if it doesn't exist (idempotent). */
  async ensureMemory(clerkUserId: string): Promise<void> {
    const coll = await getCollection<CoachMemory>(MEMORY);
    const now = new Date();
    const update = {
      $setOnInsert: {
        clerkUserId,
        schemaVersion: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        derived: { currentMode: 'normal' as const },
      },
    } as unknown as UpdateFilter<CoachMemory>;
    await coll.updateOne({ clerkUserId }, update, { upsert: true });
  },

  /** Merge onboarding/profile context into memory. */
  async updateContext(clerkUserId: string, context: NonNullable<CoachMemory['context']>): Promise<void> {
    const coll = await getCollection<CoachMemory>(MEMORY);
    const update = {
      $set: { context, updatedAt: new Date() },
    } as unknown as UpdateFilter<CoachMemory>;
    await coll.updateOne({ clerkUserId }, update, { upsert: true });
  },

  async getMemory(clerkUserId: string): Promise<CoachMemory | null> {
    const coll = await getCollection<CoachMemory>(MEMORY);
    return coll.findOne({ clerkUserId });
  },

  /** Whole days since the user's most recent signal (0 if none yet). Drives comeback detection. */
  async daysSinceLastActivity(clerkUserId: string): Promise<number> {
    const coll = await getCollection<MemorySignal>(SIGNALS);
    const recent = await coll.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(1).toArray();
    if (recent.length === 0) return 0;
    const last = new Date(recent[0].occurredAt).getTime();
    return Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
  },

  /** Deterministic projection of memory into a compact prompt block. */
  async buildCoachBrief(clerkUserId: string): Promise<string> {
    const mem = await this.getMemory(clerkUserId);
    if (!mem) {
      return 'New user — no history yet. Use onboarding context and sensible defaults.';
    }
    const goal = mem.context?.goal ?? 'unknown goal';
    const mode = mem.derived?.currentMode ?? 'normal';
    const style = mem.motivational?.bestCoachingStyle ?? 'calm';
    const language = mem.preferences?.language ?? 'english';
    return `Goal: ${goal} · Mode: ${mode} · Style: ${style} · Language: ${language}`;
  },

  /**
   * Reflection / compaction (Phase 1.5). Projects the recent signal stream through the pure
   * consistency policy and persists the derived behavioral layer onto CoachMemory:
   *   - derived.consistencyTrend   (up/flat/down vs prior week)
   *   - derived.lapseRisk          (low/med/high — drives proactive nudges + comeback)
   *   - behavioral.adherenceRate28d (0..1)
   *   - motivational.currentMotivationTrend (rising/stable/declining)
   *
   * Idempotent and cheap; safe to call on each Today load so the coach + plan always reflect
   * the latest behavior. Nested sub-objects are written whole (not via dot-paths) so the dev
   * in-memory store and MongoDB behave identically. Semantic episodic compaction comes later.
   */
  /**
   * Reflection / compaction (Phase 1.5). Projects activity dates through the pure consistency
   * policy and persists the derived behavioral layer onto CoachMemory:
   *   - derived.consistencyTrend, derived.lapseRisk
   *   - behavioral.adherenceRate28d
   *   - motivational.currentMotivationTrend
   *
   * `reflectFromDates` is the efficient core: it takes pre-fetched activity dates (so a caller
   * that already read memory_signals — e.g. getToday — does NOT trigger a second scan) and an
   * optional already-loaded memory doc (so no second coach_memory read). It also does a
   * compare-before-write: on the read path (Today loads), if nothing changed it skips the DB
   * write entirely. Returns the up-to-date memory so callers needn't re-fetch.
   */
  async reflectFromDates(
    clerkUserId: string,
    dates: string[],
    existingMemory?: CoachMemory | null,
  ): Promise<CoachMemory | null> {
    const mem = existingMemory !== undefined ? existingMemory : await this.getMemory(clerkUserId);
    if (dates.length === 0) return mem;

    const today = new Date().toISOString().slice(0, 10);
    const stats = computeConsistency(dates, today);
    const trend = computeTrend(dates, today);

    const lapseRisk: NonNullable<CoachMemory['derived']>['lapseRisk'] =
      stats.currentStreak === 0 && stats.last7 <= 1 ? 'high' : stats.monthPct < 40 ? 'med' : 'low';
    const motivationTrend: NonNullable<CoachMemory['motivational']>['currentMotivationTrend'] =
      trend === 'up' ? 'rising' : trend === 'down' ? 'declining' : 'stable';
    const adherenceRate28d = Math.round(stats.monthPct) / 100;

    // Compare-before-write: avoid a DB write on every Today load when nothing actually changed.
    if (
      mem &&
      mem.derived?.consistencyTrend === trend &&
      mem.derived?.lapseRisk === lapseRisk &&
      mem.behavioral?.adherenceRate28d === adherenceRate28d &&
      mem.motivational?.currentMotivationTrend === motivationTrend
    ) {
      return mem;
    }

    const derived = {
      ...(mem?.derived ?? { currentMode: 'normal' as const }),
      consistencyTrend: trend,
      lapseRisk,
    };
    const behavioral = { ...(mem?.behavioral ?? {}), adherenceRate28d };
    const motivational = { ...(mem?.motivational ?? {}), currentMotivationTrend: motivationTrend };

    const memColl = await getCollection<CoachMemory>(MEMORY);
    const update = {
      $set: { derived, behavioral, motivational, updatedAt: new Date() },
    } as unknown as UpdateFilter<CoachMemory>;
    await memColl.updateOne({ clerkUserId }, update, { upsert: true });

    return { ...(mem ?? ({ clerkUserId, schemaVersion: 1 } as CoachMemory)), derived, behavioral, motivational };
  },

  /** Convenience wrapper: read the recent signal stream, then reflect. */
  async reflect(clerkUserId: string): Promise<void> {
    const signals = await getCollection<MemorySignal>(SIGNALS);
    const rows = await signals.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(500).toArray();
    const dates = rows.map((r) => new Date(r.occurredAt).toISOString().slice(0, 10));
    await this.reflectFromDates(clerkUserId, dates);
  },
};
