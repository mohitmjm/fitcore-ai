import type { Filter, UpdateFilter } from 'mongodb';
import { OwnedRepository } from '@/lib/db/repository';
import type { WeeklyStorySnapshotDoc } from './types';

const COLLECTION = 'weekly_story_snapshots';

export class WeeklyStoryRepository extends OwnedRepository<WeeklyStorySnapshotDoc> {
  constructor() {
    super(COLLECTION);
  }

  async latestForWeek(clerkUserId: string, weekStart: string): Promise<WeeklyStorySnapshotDoc | null> {
    const coll = await this.coll();
    const rows = await coll
      .find({ clerkUserId, weekStart, isActive: { $ne: false } })
      .sort({ version: -1 })
      .limit(1)
      .toArray();
    return (rows[0] as WeeklyStorySnapshotDoc | undefined) ?? null;
  }

  async highestVersionForWeek(clerkUserId: string, weekStart: string): Promise<number> {
    const coll = await this.coll();
    const rows = await coll
      .find({ clerkUserId, weekStart })
      .sort({ version: -1 })
      .limit(1)
      .toArray();
    return Number((rows[0] as WeeklyStorySnapshotDoc | undefined)?.version ?? 0);
  }

  async findBySnapshotId(clerkUserId: string, snapshotId: string): Promise<WeeklyStorySnapshotDoc | null> {
    return this.findOne(clerkUserId, { snapshotId });
  }

  async listHistory(clerkUserId: string, limit: number, cursor?: string): Promise<WeeklyStorySnapshotDoc[]> {
    const coll = await this.coll();
    const filter: Filter<WeeklyStorySnapshotDoc> = {
      clerkUserId,
      isActive: { $ne: false },
      ...(cursor ? { generatedAt: { $lt: new Date(cursor) } } : {}),
    };
    return (await coll.find(filter).sort({ generatedAt: -1 }).limit(limit).toArray()) as WeeklyStorySnapshotDoc[];
  }

  async markViewed(clerkUserId: string, snapshotId: string, viewedAt: Date): Promise<boolean> {
    const coll = await this.coll();
    const result = await coll.updateOne(
      { clerkUserId, snapshotId, isActive: { $ne: false } },
      { $set: { viewedAt, updatedAt: viewedAt } } as UpdateFilter<WeeklyStorySnapshotDoc>,
    );
    return result.matchedCount > 0;
  }

  async recordShare(
    clerkUserId: string,
    snapshotId: string,
    action: 'share' | 'download' | 'copy',
    shareConfiguration: WeeklyStorySnapshotDoc['shareConfiguration'],
  ): Promise<boolean> {
    const coll = await this.coll();
    const now = new Date();
    const increment = action === 'download' ? { downloadCount: 1 } : action === 'share' ? { shareCount: 1 } : {};
    const result = await coll.updateOne(
      { clerkUserId, snapshotId, isActive: { $ne: false } },
      {
        $set: {
          shareConfiguration,
          ...(action === 'share' ? { sharedAt: now } : {}),
          updatedAt: now,
        },
        ...(Object.keys(increment).length ? { $inc: increment } : {}),
      } as UpdateFilter<WeeklyStorySnapshotDoc>,
    );
    return result.matchedCount > 0;
  }
}

export const weeklyStoryRepository = new WeeklyStoryRepository();
