import { describe, expect, it } from 'vitest';
import type { AuthContext } from '@/lib/core/context';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { weeklyStoryRepository } from './weekly-story.repository';
import { resolveWeeklyStoryRange, WeeklyStoryService } from './weekly-story.service';
import { DEFAULT_SHARE_CONFIGURATION } from './types';

function context(user: string): AuthContext {
  return { clerkUserId: user, role: 'user', plan: 'free', source: 'web' };
}

async function addSignal(user: string, type: 'checkin' | 'workout_logged' | 'meal_logged', occurredAt: string, payload?: Record<string, unknown>) {
  await MemoryService.recordSignal({ clerkUserId: user, source: 'app', type, payload, occurredAt: new Date(occurredAt) });
}

describe('weekly story service', () => {
  it('resolves Monday boundaries in the requested timezone', () => {
    const range = resolveWeeklyStoryRange({ period: 'current', timezone: 'Asia/Kolkata' }, new Date('2026-07-12T20:00:00Z'));
    expect(range.weekStart).toBe('2026-07-13');
    expect(range.weekEnd).toBe('2026-07-19');
    expect(range.previousStart).toBe('2026-07-06');
  });

  it('reuses a current immutable snapshot and versions explicit regeneration', async () => {
    const user = `story-reuse-${crypto.randomUUID()}`;
    const ctx = context(user);
    await addSignal(user, 'workout_logged', '2026-07-08T12:00:00Z', { exerciseName: 'Squat' });
    const first = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    const reused = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    const regenerated = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC', force: true });
    expect(first).not.toBeNull();
    expect(reused?.snapshotId).toBe(first?.snapshotId);
    expect(regenerated?.snapshotId).not.toBe(first?.snapshotId);
    expect(regenerated?.version).toBe(2);
  });

  it('creates a new revision when a bounded source window changes', async () => {
    const user = `story-source-${crypto.randomUUID()}`;
    const ctx = context(user);
    await addSignal(user, 'checkin', '2026-07-07T10:00:00Z');
    const first = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    await addSignal(user, 'meal_logged', '2026-07-09T10:00:00Z');
    const updated = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    expect(updated?.version).toBe((first?.version ?? 0) + 1);
    expect(updated?.storyFacts.statistics.metrics.find((metric) => metric.key === 'meals')?.value).toBe(1);
  });

  it('does not reuse a soft-deleted version number', async () => {
    const user = `story-delete-version-${crypto.randomUUID()}`;
    const ctx = context(user);
    await addSignal(user, 'checkin', '2026-07-08T10:00:00Z');
    const first = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    const second = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC', force: true });
    expect(first?.version).toBe(1);
    expect(second?.version).toBe(2);

    await WeeklyStoryService.delete(ctx, second!.snapshotId);
    const third = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC', force: true });
    expect(third?.version).toBe(3);
  });

  it('does not read future signals into a historical story', async () => {
    const user = `story-window-${crypto.randomUUID()}`;
    const ctx = context(user);
    await addSignal(user, 'checkin', '2026-07-08T10:00:00Z');
    await addSignal(user, 'meal_logged', '2026-08-08T10:00:00Z');
    const story = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    expect(story?.storyFacts.statistics.metrics.some((metric) => metric.key === 'meals')).toBe(false);
  });

  it('enforces repository ownership for snapshot IDs', async () => {
    const owner = `story-owner-${crypto.randomUUID()}`;
    const stranger = `story-stranger-${crypto.randomUUID()}`;
    await addSignal(owner, 'checkin', '2026-07-08T10:00:00Z');
    const story = await WeeklyStoryService.generate(context(owner), { weekStart: '2026-07-06', timezone: 'UTC' });
    expect(story).not.toBeNull();
    expect(await weeklyStoryRepository.findBySnapshotId(stranger, story!.snapshotId)).toBeNull();
    await expect(WeeklyStoryService.markViewed(context(stranger), story!.snapshotId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('paginates history and records privacy-safe engagement without XP mutation', async () => {
    const user = `story-history-${crypto.randomUUID()}`;
    const ctx = context(user);
    await addSignal(user, 'checkin', '2026-06-30T10:00:00Z');
    await addSignal(user, 'workout_logged', '2026-07-08T10:00:00Z', { exerciseName: 'Push-up' });
    const older = await WeeklyStoryService.generate(ctx, { weekStart: '2026-06-29', timezone: 'UTC' });
    const newer = await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    expect(older && newer).toBeTruthy();
    const firstPage = await WeeklyStoryService.history(ctx, 1);
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.nextCursor).toBeDefined();
    const secondPage = await WeeklyStoryService.history(ctx, 1, firstPage.nextCursor);
    expect(secondPage.items).toHaveLength(1);
    await WeeklyStoryService.markViewed(ctx, newer!.snapshotId);
    await WeeklyStoryService.recordShare(ctx, newer!.snapshotId, 'download', DEFAULT_SHARE_CONFIGURATION);
    const stored = await weeklyStoryRepository.findBySnapshotId(user, newer!.snapshotId);
    expect(stored?.viewedAt).toBeInstanceOf(Date);
    expect(stored?.downloadCount).toBe(1);
    expect(stored?.storyFacts.achievement.totalXp).toBe(newer!.storyFacts.achievement.totalXp);
  });

  it('returns a forming state instead of fabricating a no-data story', async () => {
    const ctx = context(`story-empty-${crypto.randomUUID()}`);
    expect(await WeeklyStoryService.generate(ctx, { weekStart: '2026-07-06', timezone: 'UTC' })).toBeNull();
    const preview = await WeeklyStoryService.preview(ctx, { weekStart: '2026-07-06', timezone: 'UTC' });
    expect(preview.status).toBe('forming');
  });
});
