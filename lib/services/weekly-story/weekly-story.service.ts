import { randomUUID } from 'node:crypto';
import type { AuthContext } from '@/lib/core/context';
import { Errors } from '@/lib/core/errors';
import { emitEvent } from '@/lib/events/bus';
import { computeGamification } from '@/lib/policy/gamification';
import {
  buildWeeklyStory,
  WEEKLY_STORY_CALCULATION_VERSION,
  WEEKLY_STORY_TEMPLATE_VERSION,
  type StoryNarrative,
  type WeeklyStoryCard,
  type WeeklyStoryPrivacySettings,
  type WeeklyStorySignal,
} from '@/lib/policy/weekly-story';
import { HabitsService } from '@/lib/services/habits/habits.service';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { MemorySignal } from '@/lib/services/memory/types';
import { PlanService } from '@/lib/services/plan/plan.service';
import { ProgressService } from '@/lib/services/progress/progress.service';
import { UsersService } from '@/lib/services/users/users.service';
import { enhanceWeeklyStoryNarrative } from './narrative';
import { weeklyStoryRepository } from './weekly-story.repository';
import {
  DEFAULT_SHARE_CONFIGURATION,
  DEFAULT_STORY_PRIVACY,
  type WeeklyStoryHistoryPage,
  type WeeklyStoryPreview,
  type WeeklyStoryShareConfiguration,
  type WeeklyStorySnapshot,
  type WeeklyStorySnapshotDoc,
} from './types';

const DAY_MS = 86_400_000;

export interface WeekRequest {
  period?: 'current' | 'previous';
  weekStart?: string;
  timezone?: string;
}

export interface GenerateStoryRequest extends WeekRequest {
  privacySettings?: WeeklyStoryPrivacySettings;
  force?: boolean;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(date: Date, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
}

function zonedDateKey(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone);
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`;
}

function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function mondayFor(dateKey: string): string {
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return addDays(dateKey, -((day + 6) % 7));
}

function zonedStartOfDay(dateKey: string, timezone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = target;
  for (let iteration = 0; iteration < 3; iteration++) {
    const actual = zonedParts(new Date(candidate), timezone);
    const represented = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    candidate += target - represented;
  }
  return new Date(candidate);
}

export function resolveWeeklyStoryRange(
  request: WeekRequest,
  now = new Date(),
): { weekStart: string; weekEnd: string; previousStart: string; previousEnd: string; timezone: string } {
  const timezone = request.timezone ?? 'Asia/Kolkata';
  const currentDate = zonedDateKey(now, timezone);
  const currentStart = mondayFor(currentDate);
  const requestedStart = request.weekStart
    ? mondayFor(request.weekStart)
    : request.period === 'current'
      ? currentStart
      : addDays(currentStart, -7);
  return {
    weekStart: requestedStart,
    weekEnd: addDays(requestedStart, 6),
    previousStart: addDays(requestedStart, -7),
    previousEnd: addDays(requestedStart, -1),
    timezone,
  };
}

function projectSignal(signal: MemorySignal, timezone: string): WeeklyStorySignal {
  const occurredAt = new Date(signal.occurredAt);
  const activityDate = zonedDateKey(occurredAt, timezone);
  return {
    type: signal.type,
    occurredAt,
    activityDate,
    localHour: zonedParts(occurredAt, timezone).hour,
    localWeekday: new Date(`${activityDate}T00:00:00Z`).getUTCDay(),
    payload: signal.payload,
  };
}

function applyNarrative(cards: WeeklyStoryCard[], narrative: StoryNarrative): WeeklyStoryCard[] {
  return cards.map((card) => {
    if (card.type === 'cover') return { ...card, title: narrative.coverHeadline, body: narrative.weekSummary, accessibilitySummary: `${narrative.coverHeadline} ${narrative.weekSummary}` };
    if (card.type === 'standout') return { ...card, title: narrative.standoutTitle, body: narrative.standoutExplanation, accessibilitySummary: `${narrative.standoutTitle}. ${narrative.standoutExplanation}` };
    if (card.type === 'coach_insight') return { ...card, body: narrative.coachInsight, accessibilitySummary: narrative.coachInsight };
    if (card.type === 'next_focus') return { ...card, title: narrative.nextFocusTitle, body: narrative.nextFocusExplanation, accessibilitySummary: `${narrative.nextFocusTitle}. ${narrative.nextFocusExplanation}` };
    if (card.type === 'share') return { ...card, title: narrative.closingLine };
    return card;
  });
}

function sourceTimestamp(
  signals: MemorySignal[],
  progressDates: string[],
  habitDates: string[],
  extraDates: (Date | string | undefined)[],
): Date {
  const times = [
    ...signals.map((signal) => +new Date(signal.occurredAt)),
    ...progressDates.map((date) => +new Date(`${date}T12:00:00Z`)),
    ...habitDates.map((date) => +new Date(`${date}T12:00:00Z`)),
    ...extraDates.filter(Boolean).map((date) => +new Date(date as Date | string)),
  ].filter(Number.isFinite);
  return new Date(times.length > 0 ? Math.max(...times) : 0);
}

function samePrivacy(a: WeeklyStoryPrivacySettings, b: WeeklyStoryPrivacySettings): boolean {
  return a.includeProgressPhotos === b.includeProgressPhotos;
}

function toPublicSnapshot(doc: WeeklyStorySnapshotDoc): WeeklyStorySnapshot {
  return {
    snapshotId: doc.snapshotId,
    weekStart: doc.weekStart,
    weekEnd: doc.weekEnd,
    timezone: doc.timezone,
    version: doc.version,
    calculationVersion: doc.calculationVersion,
    templateVersion: doc.templateVersion,
    generatedAt: new Date(doc.generatedAt).toISOString(),
    sourceUpdatedAt: new Date(doc.sourceUpdatedAt).toISOString(),
    storyFacts: doc.storyFacts,
    cards: doc.cards,
    narrative: doc.narrative,
    dataQuality: doc.dataQuality,
    privacySettings: doc.privacySettings,
    generationProvider: doc.generationProvider,
    generationMode: doc.generationMode,
    shareConfiguration: doc.shareConfiguration,
    ...(doc.viewedAt ? { viewedAt: new Date(doc.viewedAt).toISOString() } : {}),
    ...(doc.sharedAt ? { sharedAt: new Date(doc.sharedAt).toISOString() } : {}),
    downloadCount: doc.downloadCount,
    shareCount: doc.shareCount,
  };
}

async function gatherStorySources(ctx: AuthContext, request: GenerateStoryRequest) {
  const range = resolveWeeklyStoryRange(request);
  const from = zonedStartOfDay(range.previousStart, range.timezone);
  const toExclusive = zonedStartOfDay(addDays(range.weekEnd, 1), range.timezone);
  const progressStart = addDays(range.weekStart, -84);
  const privacy = request.privacySettings ?? DEFAULT_STORY_PRIVACY;

  const [windowSignals, allSignals, memory, plan, user, progressLogs, habitLogs, progressPhotos] = await Promise.all([
    MemoryService.getSignalsBetween(ctx.clerkUserId, from, toExclusive),
    MemoryService.getSignalsThrough(ctx.clerkUserId, toExclusive),
    MemoryService.getMemory(ctx.clerkUserId),
    PlanService.getCurrent(ctx.clerkUserId),
    UsersService.getByClerkId(ctx.clerkUserId),
    ProgressService.getLogsWindow(ctx.clerkUserId, progressStart, range.weekEnd),
    HabitsService.getRange(ctx.clerkUserId, range.previousStart, range.weekEnd),
    privacy.includeProgressPhotos
      ? ProgressService.getRecentPhotosThrough(ctx.clerkUserId, range.weekEnd, 8)
      : Promise.resolve([]),
  ]);

  const projectedWindow = windowSignals.map((signal) => projectSignal(signal, range.timezone));
  const projectedAll = allSignals.map((signal) => projectSignal(signal, range.timezone));
  const currentSignals = projectedWindow.filter((signal) => signal.activityDate! >= range.weekStart && signal.activityDate! <= range.weekEnd);
  const previousSignals = projectedWindow.filter((signal) => signal.activityDate! >= range.previousStart && signal.activityDate! <= range.previousEnd);
  const throughCurrent = projectedAll.filter((signal) => signal.activityDate! <= range.weekEnd);
  const throughPrevious = projectedAll.filter((signal) => signal.activityDate! <= range.previousEnd);
  const gameFor = (signals: WeeklyStorySignal[], today: string) => computeGamification({
    signalTypes: signals.map((signal) => signal.type),
    activityDates: signals.map((signal) => signal.activityDate!),
    today,
    events: signals.map((signal) => ({ type: signal.type, occurredAt: signal.occurredAt, payload: signal.payload })),
  });
  const gamification = gameFor(throughCurrent, range.weekEnd);
  const previousGamification = gameFor(throughPrevious, range.previousEnd);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Athlete';
  const facts = buildWeeklyStory({
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
    timezone: range.timezone,
    firstName,
    goal: user?.profile?.goal ?? memory?.context?.goal,
    commitmentDays: memory?.context?.weeklyCommitmentDays,
    currentSignals,
    previousSignals,
    allSignalsThroughWeek: throughCurrent,
    gamification,
    previousGamification,
    progressLogs,
    habitLogs,
    memory,
    planDays: plan?.days.length,
    progressPhotos,
    privacySettings: privacy,
  });
  const sourceUpdatedAt = sourceTimestamp(
    windowSignals,
    progressLogs.map((log) => log.recordedDate),
    habitLogs.map((log) => log.date),
    [...progressPhotos.map((photo) => photo.takenAt)],
  );
  return { range, privacy, facts, sourceUpdatedAt };
}

export const WeeklyStoryService = {
  async generate(ctx: AuthContext, request: GenerateStoryRequest = {}): Promise<WeeklyStorySnapshot | null> {
    const sources = await gatherStorySources(ctx, request);
    if (!sources.facts.eligible) return null;

    const existing = await weeklyStoryRepository.latestForWeek(ctx.clerkUserId, sources.range.weekStart);
    if (
      existing &&
      !request.force &&
      samePrivacy(existing.privacySettings, sources.privacy) &&
      +new Date(existing.sourceUpdatedAt) >= +sources.sourceUpdatedAt
    ) {
      return toPublicSnapshot(existing);
    }

    const enhanced = await enhanceWeeklyStoryNarrative(sources.facts);
    const cards = applyNarrative(sources.facts.cards, enhanced.narrative);
    const { cards: _deterministicCards, ...storyFacts } = sources.facts;
    void _deterministicCards;
    const now = new Date();
    const highestVersion = await weeklyStoryRepository.highestVersionForWeek(
      ctx.clerkUserId,
      sources.range.weekStart,
    );
    const version = Math.max(existing?.version ?? 0, highestVersion) + 1;
    const doc: Omit<WeeklyStorySnapshotDoc, 'clerkUserId' | 'isActive' | 'createdAt' | 'updatedAt'> = {
      snapshotId: randomUUID(),
      weekStart: sources.range.weekStart,
      weekEnd: sources.range.weekEnd,
      timezone: sources.range.timezone,
      version,
      calculationVersion: WEEKLY_STORY_CALCULATION_VERSION,
      templateVersion: WEEKLY_STORY_TEMPLATE_VERSION,
      generatedAt: now,
      sourceUpdatedAt: sources.sourceUpdatedAt,
      storyFacts,
      cards,
      narrative: enhanced.narrative,
      dataQuality: sources.facts.dataQuality,
      privacySettings: sources.privacy,
      generationProvider: enhanced.provider,
      generationMode: enhanced.mode,
      shareConfiguration: existing?.shareConfiguration ?? DEFAULT_SHARE_CONFIGURATION,
      downloadCount: 0,
      shareCount: 0,
    };

    try {
      await weeklyStoryRepository.create(ctx.clerkUserId, doc);
    } catch (error) {
      const code = (error as { code?: unknown }).code;
      if (code !== 11000 || request.force) throw error;
      const raced = await weeklyStoryRepository.latestForWeek(ctx.clerkUserId, sources.range.weekStart);
      if (raced) return toPublicSnapshot(raced);
      throw error;
    }
    const saved = await weeklyStoryRepository.findBySnapshotId(ctx.clerkUserId, doc.snapshotId);
    if (!saved) throw Errors.notFound('Weekly story');
    await emitEvent({ type: 'weekly_story.generated', clerkUserId: ctx.clerkUserId, snapshotId: doc.snapshotId, weekStart: doc.weekStart, version });
    return toPublicSnapshot(saved);
  },

  async get(ctx: AuthContext, request: WeekRequest = {}): Promise<WeeklyStorySnapshot | null> {
    return this.generate(ctx, request);
  },

  async preview(ctx: AuthContext, request: WeekRequest = {}): Promise<WeeklyStoryPreview> {
    const range = resolveWeeklyStoryRange(request);
    const existing = await weeklyStoryRepository.latestForWeek(ctx.clerkUserId, range.weekStart);
    if (existing) {
      return {
        status: 'ready',
        snapshotId: existing.snapshotId,
        weekStart: range.weekStart,
        weekEnd: range.weekEnd,
        viewed: Boolean(existing.viewedAt),
        consistencyPct: existing.storyFacts.statistics.consistencyPct,
        standout: existing.storyFacts.standout?.title,
      };
    }
    const signals = await MemoryService.getSignalsBetween(
      ctx.clerkUserId,
      zonedStartOfDay(range.weekStart, range.timezone),
      zonedStartOfDay(addDays(range.weekEnd, 1), range.timezone),
      1,
    );
    if (signals.length > 0) {
      return { status: 'ready', weekStart: range.weekStart, weekEnd: range.weekEnd, viewed: false };
    }
    return {
      status: 'forming',
      message: 'Keep checking in—your first weekly story is taking shape.',
      weekStart: range.weekStart,
      weekEnd: range.weekEnd,
    };
  },

  async history(ctx: AuthContext, limit: number, cursor?: string): Promise<WeeklyStoryHistoryPage> {
    const docs = await weeklyStoryRepository.listHistory(ctx.clerkUserId, limit + 1, cursor);
    const hasMore = docs.length > limit;
    const items = docs.slice(0, limit).map((doc) => ({
      snapshotId: doc.snapshotId,
      weekStart: doc.weekStart,
      weekEnd: doc.weekEnd,
      timezone: doc.timezone,
      version: doc.version,
      generatedAt: new Date(doc.generatedAt).toISOString(),
      ...(doc.viewedAt ? { viewedAt: new Date(doc.viewedAt).toISOString() } : {}),
      consistencyPct: doc.storyFacts.statistics.consistencyPct,
      standout: doc.storyFacts.standout?.title,
      level: doc.storyFacts.achievement.level,
    }));
    return {
      items,
      ...(hasMore && items.length > 0 ? { nextCursor: items[items.length - 1].generatedAt } : {}),
    };
  },

  async markViewed(ctx: AuthContext, snapshotId: string): Promise<void> {
    const story = await weeklyStoryRepository.findBySnapshotId(ctx.clerkUserId, snapshotId);
    if (!story) throw Errors.notFound('Weekly story');
    if (!story.viewedAt) await weeklyStoryRepository.markViewed(ctx.clerkUserId, snapshotId, new Date());
    await emitEvent({ type: 'weekly_story.viewed', clerkUserId: ctx.clerkUserId, snapshotId, weekStart: story.weekStart });
  },

  async recordShare(
    ctx: AuthContext,
    snapshotId: string,
    action: 'share' | 'download' | 'copy',
    configuration: WeeklyStoryShareConfiguration,
  ): Promise<void> {
    const story = await weeklyStoryRepository.findBySnapshotId(ctx.clerkUserId, snapshotId);
    if (!story) throw Errors.notFound('Weekly story');
    await weeklyStoryRepository.recordShare(ctx.clerkUserId, snapshotId, action, configuration);
    if (action === 'download') {
      await emitEvent({ type: 'weekly_story.downloaded', clerkUserId: ctx.clerkUserId, snapshotId, weekStart: story.weekStart });
    } else {
      await emitEvent({ type: 'weekly_story.shared', clerkUserId: ctx.clerkUserId, snapshotId, weekStart: story.weekStart, method: action === 'copy' ? 'copy' : 'share' });
    }
  },

  async delete(ctx: AuthContext, snapshotId: string): Promise<void> {
    const story = await weeklyStoryRepository.findBySnapshotId(ctx.clerkUserId, snapshotId);
    if (!story) throw Errors.notFound('Weekly story');
    await weeklyStoryRepository.softDelete(ctx.clerkUserId, { snapshotId });
  },
};
