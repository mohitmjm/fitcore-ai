import type { Db } from 'mongodb';

/**
 * Idempotent index creation for the hot query paths.
 *
 * Every user-scoped read filters by `clerkUserId` and most sort by a recency field. Without
 * these compound indexes MongoDB does a COLLSCAN + in-memory SORT for each query — O(N log N)
 * over the whole collection, and worse, an unindexed sort aborts once it exceeds 32MB. With the
 * compound indexes below the same queries become index range scans: O(log N + k).
 *
 * `createIndex` is idempotent (a matching spec is a no-op) and cheap, so this is safe to run once
 * per process. It is invoked fire-and-forget from getDb() on the real-Mongo path only (the dev
 * in-memory store has no indexes and never calls this).
 */
export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    // Unified activity stream — the single hottest query (consistency, gamification, reflect).
    db.collection('memory_signals').createIndex({ clerkUserId: 1, occurredAt: -1 }, { name: 'user_recent' }),
    // One memory doc per user (findOne/upsert by clerkUserId).
    db.collection('coach_memory').createIndex({ clerkUserId: 1 }, { name: 'user' }),
    db.collection('users').createIndex({ clerkUserId: 1 }, { name: 'user' }),
    // Coach chat history.
    db.collection('coach_messages').createIndex({ clerkUserId: 1, createdAt: 1 }, { name: 'user_time' }),
    // Living plan = most recent active plan.
    db.collection('workout_plans').createIndex({ clerkUserId: 1, isActive: 1, createdAt: -1 }, { name: 'user_active_recent' }),
    db.collection('diet_plans').createIndex({ clerkUserId: 1, isActive: 1, createdAt: -1 }, { name: 'user_active_recent' }),
    // Per-day exercise completions + habits.
    db.collection('workout_completions').createIndex({ clerkUserId: 1, date: 1 }, { name: 'user_day' }),
    db.collection('habit_logs').createIndex({ clerkUserId: 1, date: 1, habit: 1 }, { name: 'user_day_habit' }),
    // Progress logs + photos (sorted by recency).
    db.collection('progress_logs').createIndex({ clerkUserId: 1, recordedDate: -1 }, { name: 'user_recent' }),
    db.collection('progress_photos').createIndex({ clerkUserId: 1, takenAt: -1 }, { name: 'user_recent' }),
    db.collection('saved_exercises').createIndex({ clerkUserId: 1, exerciseId: 1 }, { name: 'user_exercise' }),
    db.collection('workout_drafts').createIndex({ clerkUserId: 1, target: 1, targetName: 1 }, { name: 'user_target' }),
    // Immutable Weekly Story revisions and bounded archive retrieval.
    db.collection('weekly_story_snapshots').createIndex(
      { clerkUserId: 1, weekStart: 1, version: 1 },
      { name: 'user_week_version', unique: true },
    ),
    db.collection('weekly_story_snapshots').createIndex(
      { clerkUserId: 1, generatedAt: -1 },
      { name: 'user_story_history' },
    ),
    db.collection('weekly_story_snapshots').createIndex(
      { clerkUserId: 1, snapshotId: 1 },
      { name: 'user_snapshot', unique: true },
    ),
    // WhatsApp / channel identity resolution.
    db.collection('channel_contacts').createIndex({ channel: 1, externalId: 1 }, { name: 'channel_external' }),
  ]);
}
