import type { GamificationState } from './gamification';
import type { CoachMemory } from '@/lib/services/memory/types';

export const WEEKLY_STORY_CALCULATION_VERSION = 1;
export const WEEKLY_STORY_TEMPLATE_VERSION = 1;

const DAY_MS = 86_400_000;

export type StoryAccent = 'lime' | 'violet' | 'mint' | 'amber' | 'coral';
export type StoryTrend = 'up' | 'flat' | 'down';

export interface WeeklyStorySignal {
  type: string;
  occurredAt: string | Date;
  /** Date/hour projected into the snapshot timezone by the service. */
  activityDate?: string;
  localHour?: number;
  localWeekday?: number;
  payload?: Record<string, unknown>;
}

export interface WeeklyStoryProgressLog {
  recordedDate: string;
  weightKg?: number;
  waistInches?: number;
  chestInches?: number;
  armsInches?: number;
}

export interface WeeklyStoryHabitLog {
  date: string;
  habit: string;
  value: number;
  goal?: number;
}

export interface WeeklyStoryPhoto {
  url: string;
  takenAt: string;
}

export interface WeeklyStoryPrivacySettings {
  includeProgressPhotos: boolean;
}

export interface WeeklyStoryPolicyInput {
  weekStart: string;
  weekEnd: string;
  timezone: string;
  firstName: string;
  goal?: string;
  commitmentDays?: number;
  currentSignals: WeeklyStorySignal[];
  previousSignals: WeeklyStorySignal[];
  allSignalsThroughWeek: WeeklyStorySignal[];
  gamification: GamificationState;
  previousGamification: GamificationState;
  progressLogs: WeeklyStoryProgressLog[];
  habitLogs: WeeklyStoryHabitLog[];
  memory: CoachMemory | null;
  planDays?: number;
  progressPhotos?: WeeklyStoryPhoto[];
  privacySettings: WeeklyStoryPrivacySettings;
}

export interface WeeklyStoryMetric {
  key: 'workouts' | 'meals' | 'water' | 'sleep' | 'habits' | 'checkins' | 'progress' | 'active_days';
  label: string;
  value: number;
  unit?: string;
}

export interface StoryHighlight {
  kind:
    | 'personal_record'
    | 'level_up'
    | 'badge'
    | 'comeback'
    | 'first_workout'
    | 'commitment'
    | 'improved_sleep'
    | 'training_day';
  title: string;
  explanation: string;
  score: number;
}

export interface StoryComeback {
  quietDays: number;
  returnDate: string;
  title: string;
  explanation: string;
}

export interface StoryProgressTrend {
  kind: 'weight' | 'waist' | 'sleep' | 'consistency';
  direction: StoryTrend;
  label: string;
  summary: string;
  points: { label: string; value: number }[];
  private: boolean;
}

export interface StoryNarrative {
  coverHeadline: string;
  weekSummary: string;
  standoutTitle: string;
  standoutExplanation: string;
  coachInsight: string;
  nextFocusTitle: string;
  nextFocusExplanation: string;
  closingLine: string;
}

interface StoryCardBase {
  id: string;
  type:
    | 'cover'
    | 'consistency'
    | 'activity'
    | 'standout'
    | 'comeback'
    | 'progress_trend'
    | 'coach_insight'
    | 'achievement'
    | 'progress_photo'
    | 'next_focus'
    | 'share';
  kicker: string;
  title: string;
  body: string;
  accent: StoryAccent;
  shareSafe: boolean;
  accessibilitySummary: string;
}

export interface CoverStoryCard extends StoryCardBase {
  type: 'cover';
  data: {
    firstName: string;
    dateRange: string;
    consistencyPct: number;
    level: number;
    identity: string;
  };
}

export interface ConsistencyStoryCard extends StoryCardBase {
  type: 'consistency';
  data: {
    activeDays: number;
    commitmentDays: number;
    consistencyPct: number;
    previousPct: number;
    changePct: number;
    currentStreak: number;
    longestStreak: number;
    momentum: StoryTrend;
  };
}

export interface ActivityStoryCard extends StoryCardBase {
  type: 'activity';
  data: { metrics: WeeklyStoryMetric[] };
}

export interface StandoutStoryCard extends StoryCardBase {
  type: 'standout';
  data: StoryHighlight;
}

export interface ComebackStoryCard extends StoryCardBase {
  type: 'comeback';
  data: StoryComeback;
}

export interface ProgressTrendStoryCard extends StoryCardBase {
  type: 'progress_trend';
  data: StoryProgressTrend;
}

export interface CoachInsightStoryCard extends StoryCardBase {
  type: 'coach_insight';
  data: { supported: boolean; evidenceCount: number };
}

export interface AchievementStoryCard extends StoryCardBase {
  type: 'achievement';
  data: {
    xpEarned: number;
    totalXp: number;
    level: number;
    levelTitle: string;
    progressPct: number;
    badgesUnlocked: { id: string; label: string }[];
    nextBadge?: { id: string; label: string; progress: number; target: number };
  };
}

export interface ProgressPhotoStoryCard extends StoryCardBase {
  type: 'progress_photo';
  data: { beforeUrl: string; beforeDate: string; currentUrl: string; currentDate: string };
}

export interface NextFocusStoryCard extends StoryCardBase {
  type: 'next_focus';
  data: { action: string; target?: number; unit?: string };
}

export interface ShareStoryCard extends StoryCardBase {
  type: 'share';
  data: {
    firstName: string;
    dateRange: string;
    consistencyPct: number;
    activeDays: number;
    workoutCount: number;
    level: number;
    badge?: string;
    comeback?: string;
  };
}

export type WeeklyStoryCard =
  | CoverStoryCard
  | ConsistencyStoryCard
  | ActivityStoryCard
  | StandoutStoryCard
  | ComebackStoryCard
  | ProgressTrendStoryCard
  | CoachInsightStoryCard
  | AchievementStoryCard
  | ProgressPhotoStoryCard
  | NextFocusStoryCard
  | ShareStoryCard;

export interface WeeklyStoryFacts {
  eligible: boolean;
  week: { start: string; end: string; timezone: string; label: string };
  statistics: {
    activeDays: number;
    commitmentDays: number;
    consistencyPct: number;
    previousConsistencyPct: number;
    changePct: number;
    currentStreak: number;
    longestStreak: number;
    momentum: StoryTrend;
    metrics: WeeklyStoryMetric[];
  };
  standout?: StoryHighlight;
  comeback?: StoryComeback;
  progressTrend?: StoryProgressTrend;
  coachInsight: { text: string; supported: boolean; evidenceCount: number };
  achievement: AchievementStoryCard['data'];
  nextFocus: { title: string; explanation: string; action: string; target?: number; unit?: string };
  privacySafeFacts: ShareStoryCard['data'];
  fallbackNarrative: StoryNarrative;
  dataQuality: string[];
  cards: WeeklyStoryCard[];
}

function dateMs(value: string): number {
  return Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
}

function dateKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function signalDate(signal: WeeklyStorySignal): string {
  return signal.activityDate?.slice(0, 10) ?? dateKey(signal.occurredAt);
}

function daysBetween(a: string, b: string): number {
  return Math.round((dateMs(b) - dateMs(a)) / DAY_MS);
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function clampCommitment(value: number | undefined): number {
  return Math.min(7, Math.max(1, Math.round(value ?? 3)));
}

function percentage(activeDays: number, commitmentDays: number): number {
  return Math.min(100, Math.round((activeDays / commitmentDays) * 100));
}

function formatRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const startText = startDate.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const endText = endDate.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${startText} \u2013 ${endText}`;
}

function uniqueActivityDays(signals: WeeklyStorySignal[]): string[] {
  return [...new Set(signals.map(signalDate))].sort();
}

function signalCount(signals: WeeklyStorySignal[], type: string): number {
  return signals.filter((signal) => signal.type === type).length;
}

function workoutDays(signals: WeeklyStorySignal[]): number {
  return new Set(
    signals
      .filter((signal) => signal.type === 'workout_logged')
      .map((signal) => String(signal.payload?.date ?? signalDate(signal)).slice(0, 10)),
  ).size;
}

function buildMetrics(signals: WeeklyStorySignal[], activeDays: number): WeeklyStoryMetric[] {
  const candidates: WeeklyStoryMetric[] = [
    { key: 'workouts', label: 'Training days', value: workoutDays(signals) },
    { key: 'meals', label: 'Meals logged', value: signalCount(signals, 'meal_logged') },
    { key: 'water', label: 'Water check-ins', value: signalCount(signals, 'water_logged') },
    { key: 'sleep', label: 'Sleep logs', value: signalCount(signals, 'sleep_logged') },
    { key: 'habits', label: 'Habit check-ins', value: signalCount(signals, 'habit_logged') },
    { key: 'checkins', label: 'Check-ins', value: signalCount(signals, 'checkin') },
    { key: 'progress', label: 'Progress entries', value: signalCount(signals, 'weight_logged') },
    { key: 'active_days', label: 'Active days', value: activeDays, unit: activeDays === 1 ? 'day' : 'days' },
  ];
  return candidates.filter((metric) => metric.value > 0);
}

function detectComeback(
  current: WeeklyStorySignal[],
  previous: WeeklyStorySignal[],
  weekStart: string,
  weekEnd: string,
): StoryComeback | undefined {
  const dates = [...new Set([...previous, ...current].map(signalDate))].sort();
  for (let index = 1; index < dates.length; index++) {
    const returnDate = dates[index];
    const quietDays = daysBetween(dates[index - 1], returnDate) - 1;
    if (quietDays >= 4 && inRange(returnDate, weekStart, weekEnd)) {
      return {
        quietDays,
        returnDate,
        title: 'You came back',
        explanation: `You returned after ${quietDays} quiet days. That return matters more than a perfect streak.`,
      };
    }
  }
  return undefined;
}

function numericPayload(signal: WeeklyStorySignal, key: string): number | undefined {
  const value = signal.payload?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sleepAverage(logs: WeeklyStoryHabitLog[], start: string, end: string): number | undefined {
  return average(
    logs
      .filter((log) => log.habit === 'sleep' && inRange(log.date, start, end) && log.value > 0)
      .map((log) => log.value),
  );
}

function buildProgressTrend(input: WeeklyStoryPolicyInput, currentPct: number, previousPct: number): StoryProgressTrend | undefined {
  const ordered = [...input.progressLogs]
    .filter((log) => log.recordedDate <= input.weekEnd)
    .sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
  const firstWeight = ordered.find((log) => typeof log.weightKg === 'number');
  const lastWeight = [...ordered].reverse().find((log) => typeof log.weightKg === 'number');
  if (
    firstWeight?.weightKg !== undefined &&
    lastWeight?.weightKg !== undefined &&
    firstWeight.recordedDate !== lastWeight.recordedDate &&
    daysBetween(firstWeight.recordedDate, lastWeight.recordedDate) >= 7
  ) {
    const delta = Math.round((lastWeight.weightKg - firstWeight.weightKg) * 10) / 10;
    const direction: StoryTrend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    return {
      kind: 'weight',
      direction,
      label: 'Weight trend',
      summary: delta === 0 ? 'Your recent weight range held steady.' : `Your recent range moved by about ${Math.abs(delta)} kg across ${daysBetween(firstWeight.recordedDate, lastWeight.recordedDate)} days.`,
      points: [
        { label: firstWeight.recordedDate, value: firstWeight.weightKg },
        { label: lastWeight.recordedDate, value: lastWeight.weightKg },
      ],
      private: true,
    };
  }

  const previousStart = new Date(dateMs(input.weekStart) - 7 * DAY_MS).toISOString().slice(0, 10);
  const previousEnd = new Date(dateMs(input.weekStart) - DAY_MS).toISOString().slice(0, 10);
  const currentSleep = sleepAverage(input.habitLogs, input.weekStart, input.weekEnd);
  const previousSleep = sleepAverage(input.habitLogs, previousStart, previousEnd);
  if (currentSleep !== undefined && previousSleep !== undefined) {
    const delta = currentSleep - previousSleep;
    const direction: StoryTrend = delta > 0.25 ? 'up' : delta < -0.25 ? 'down' : 'flat';
    return {
      kind: 'sleep',
      direction,
      label: 'Sleep rhythm',
      summary: direction === 'up' ? 'Your logged sleep range improved from the previous week.' : direction === 'down' ? 'Your logged sleep range was lighter this week.' : 'Your logged sleep range stayed steady.',
      points: [
        { label: 'Previous week', value: Math.round(previousSleep * 10) / 10 },
        { label: 'This week', value: Math.round(currentSleep * 10) / 10 },
      ],
      private: false,
    };
  }

  if (currentPct !== previousPct) {
    return {
      kind: 'consistency',
      direction: currentPct > previousPct ? 'up' : 'down',
      label: 'Commitment trend',
      summary: currentPct > previousPct ? 'You completed more of your chosen weekly commitment.' : 'This week was lighter. Your next step is intentionally small.',
      points: [
        { label: 'Previous week', value: previousPct },
        { label: 'This week', value: currentPct },
      ],
      private: false,
    };
  }
  return undefined;
}

function buildCoachInsight(input: WeeklyStoryPolicyInput): WeeklyStoryFacts['coachInsight'] {
  const workoutSignals = input.currentSignals.filter((signal) => signal.type === 'workout_logged');
  const workoutDaysWithHour = new Map<string, number>();
  for (const signal of workoutSignals) {
    const date = new Date(signal.occurredAt);
    workoutDaysWithHour.set(signalDate(signal), signal.localHour ?? date.getUTCHours());
  }
  if (workoutDaysWithHour.size >= 3) {
    const beforeEight = [...workoutDaysWithHour.values()].filter((hour) => hour < 20).length;
    if (beforeEight / workoutDaysWithHour.size >= 0.67) {
      return {
        text: 'Your training showed up most often before 8 PM this week.',
        supported: true,
        evidenceCount: workoutDaysWithHour.size,
      };
    }
  }

  const mealSignals = input.currentSignals.filter((signal) => signal.type === 'meal_logged');
  if (mealSignals.length >= 4) {
    const weekdays = mealSignals.filter((signal) => {
      const day = signal.localWeekday ?? new Date(signal.occurredAt).getUTCDay();
      return day >= 1 && day <= 5;
    }).length;
    if (weekdays / mealSignals.length >= 0.75) {
      return {
        text: 'Your meal logging was strongest on weekdays this week.',
        supported: true,
        evidenceCount: mealSignals.length,
      };
    }
  }

  const shortSessions = workoutSignals.filter((signal) => {
    const duration = numericPayload(signal, 'durationMin');
    return duration !== undefined && duration <= 20;
  });
  if (shortSessions.length >= 2) {
    return {
      text: 'Short sessions helped you keep your training rhythm on demanding days.',
      supported: true,
      evidenceCount: shortSessions.length,
    };
  }

  return {
    text: 'Keep checking in. Your coach needs a little more repeated data before naming a reliable pattern.',
    supported: false,
    evidenceCount: input.currentSignals.length,
  };
}

function buildStandout(
  input: WeeklyStoryPolicyInput,
  comeback: StoryComeback | undefined,
  consistencyPct: number,
): StoryHighlight | undefined {
  const candidates: StoryHighlight[] = [];
  const personalRecord = input.currentSignals.find(
    (signal) => signal.payload?.personalRecord === true || signal.payload?.isPersonalRecord === true,
  );
  if (personalRecord) {
    const label = typeof personalRecord.payload?.label === 'string' ? personalRecord.payload.label : 'A new personal record';
    candidates.push({ kind: 'personal_record', title: label, explanation: 'You recorded a verified personal best this week.', score: 110 });
  }

  if (input.gamification.level > input.previousGamification.level) {
    candidates.push({
      kind: 'level_up',
      title: `Level ${input.gamification.level} reached`,
      explanation: `Your consistent actions moved you into ${input.gamification.levelTitle}.`,
      score: 100,
    });
  }

  const priorEarned = new Set(input.previousGamification.badges.filter((badge) => badge.earned).map((badge) => badge.id));
  const badge = input.gamification.badges.find((item) => item.earned && !priorEarned.has(item.id));
  if (badge) {
    candidates.push({ kind: 'badge', title: badge.label, explanation: badge.description, score: 96 });
  }

  if (comeback) {
    candidates.push({ kind: 'comeback', title: comeback.title, explanation: comeback.explanation, score: 92 });
  }

  const workoutsBeforeWeek = input.allSignalsThroughWeek.filter(
    (signal) => signal.type === 'workout_logged' && signalDate(signal) < input.weekStart,
  ).length;
  if (workoutDays(input.currentSignals) > 0 && workoutsBeforeWeek === 0) {
    candidates.push({ kind: 'first_workout', title: 'Your first training day', explanation: 'You turned intention into a real recorded session.', score: 88 });
  }

  if (consistencyPct === 100) {
    candidates.push({ kind: 'commitment', title: 'Commitment kept', explanation: 'You completed the weekly rhythm you chose for yourself.', score: 82 });
  }

  const currentSleep = sleepAverage(input.habitLogs, input.weekStart, input.weekEnd);
  const previousStart = new Date(dateMs(input.weekStart) - 7 * DAY_MS).toISOString().slice(0, 10);
  const previousEnd = new Date(dateMs(input.weekStart) - DAY_MS).toISOString().slice(0, 10);
  const previousSleep = sleepAverage(input.habitLogs, previousStart, previousEnd);
  if (currentSleep !== undefined && previousSleep !== undefined && currentSleep >= previousSleep + 0.5) {
    candidates.push({ kind: 'improved_sleep', title: 'Sleep moved in a better direction', explanation: 'Your logged sleep average improved from the previous week.', score: 76 });
  }

  const trainingDays = workoutDays(input.currentSignals);
  if (trainingDays > 0) {
    candidates.push({ kind: 'training_day', title: trainingDays === 1 ? 'One promise kept' : `${trainingDays} training days`, explanation: trainingDays === 1 ? 'You kept one training promise to yourself this week.' : 'You built your week through repeated effort.', score: 60 });
  }

  return candidates.sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind))[0];
}

function buildNextFocus(
  input: WeeklyStoryPolicyInput,
  comeback: StoryComeback | undefined,
  consistencyPct: number,
  commitmentDays: number,
): WeeklyStoryFacts['nextFocus'] {
  if (comeback) {
    return {
      title: 'Continue the comeback',
      explanation: 'Two short sessions are enough to make the return feel repeatable.',
      action: 'Complete two short sessions',
      target: 2,
      unit: 'sessions',
    };
  }

  const currentSleep = sleepAverage(input.habitLogs, input.weekStart, input.weekEnd);
  if (currentSleep !== undefined && currentSleep < 6.5) {
    return {
      title: 'Protect sleep',
      explanation: 'Keep the training ask steady and give recovery one clear place in the week.',
      action: 'Log and protect three nights of sleep',
      target: 3,
      unit: 'nights',
    };
  }

  if (consistencyPct >= 100) {
    return {
      title: 'Maintain the rhythm',
      explanation: 'Repeat the commitment you already proved is workable. No escalation needed.',
      action: `Complete ${commitmentDays} planned days`,
      target: commitmentDays,
      unit: 'days',
    };
  }

  const target = Math.min(commitmentDays, Math.max(2, workoutDays(input.currentSignals)));
  return {
    title: target <= 2 ? 'Restart small' : 'Meet the plan you chose',
    explanation: target <= 2 ? 'A smaller target makes the next return easier to repeat.' : 'Focus on the planned days, not extra volume.',
    action: `Complete ${target} planned sessions`,
    target,
    unit: 'sessions',
  };
}

function eligiblePhotoPair(input: WeeklyStoryPolicyInput): ProgressPhotoStoryCard['data'] | undefined {
  if (!input.privacySettings.includeProgressPhotos) return undefined;
  const photos = [...(input.progressPhotos ?? [])]
    .filter((photo) => /^(https:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i.test(photo.url) && photo.takenAt.slice(0, 10) <= input.weekEnd)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  if (photos.length < 2) return undefined;
  const current = photos[photos.length - 1];
  const before = photos.find((photo) => daysBetween(photo.takenAt.slice(0, 10), current.takenAt.slice(0, 10)) >= 14);
  if (!before) return undefined;
  return {
    beforeUrl: before.url,
    beforeDate: before.takenAt.slice(0, 10),
    currentUrl: current.url,
    currentDate: current.takenAt.slice(0, 10),
  };
}

function makeCards(facts: Omit<WeeklyStoryFacts, 'cards'>, firstName: string, photo?: ProgressPhotoStoryCard['data']): WeeklyStoryCard[] {
  const cards: WeeklyStoryCard[] = [
    {
      id: 'cover', type: 'cover', kicker: 'FitCore Weekly Story', title: facts.fallbackNarrative.coverHeadline,
      body: facts.fallbackNarrative.weekSummary, accent: 'lime', shareSafe: true,
      accessibilitySummary: `${facts.week.label}. ${facts.statistics.consistencyPct}% consistency and level ${facts.achievement.level}.`,
      data: { firstName, dateRange: facts.week.label, consistencyPct: facts.statistics.consistencyPct, level: facts.achievement.level, identity: facts.achievement.levelTitle },
    },
    {
      id: 'consistency', type: 'consistency', kicker: 'Your commitment', title: `${facts.statistics.activeDays} of ${facts.statistics.commitmentDays} chosen days`,
      body: facts.statistics.changePct === 0 ? 'Your commitment rhythm held steady.' : facts.statistics.changePct > 0 ? `Up ${facts.statistics.changePct} points from the previous week.` : `A lighter week by ${Math.abs(facts.statistics.changePct)} points. You are continuing, not starting over.`,
      accent: 'mint', shareSafe: true,
      accessibilitySummary: `${facts.statistics.activeDays} active days against a ${facts.statistics.commitmentDays} day commitment, ${facts.statistics.consistencyPct} percent complete.`,
      data: { activeDays: facts.statistics.activeDays, commitmentDays: facts.statistics.commitmentDays, consistencyPct: facts.statistics.consistencyPct, previousPct: facts.statistics.previousConsistencyPct, changePct: facts.statistics.changePct, currentStreak: facts.statistics.currentStreak, longestStreak: facts.statistics.longestStreak, momentum: facts.statistics.momentum },
    },
    {
      id: 'activity', type: 'activity', kicker: 'Week at a glance', title: 'The work you recorded',
      body: 'Only real, non-zero activity from this week is shown.', accent: 'violet', shareSafe: true,
      accessibilitySummary: facts.statistics.metrics.map((metric) => `${metric.label}: ${metric.value}`).join('. '),
      data: { metrics: facts.statistics.metrics },
    },
  ];

  if (facts.standout && !(facts.standout.kind === 'comeback' && facts.comeback)) cards.push({
    id: 'standout', type: 'standout', kicker: 'Standout moment', title: facts.fallbackNarrative.standoutTitle,
    body: facts.fallbackNarrative.standoutExplanation, accent: 'amber', shareSafe: true,
    accessibilitySummary: `${facts.fallbackNarrative.standoutTitle}. ${facts.fallbackNarrative.standoutExplanation}`,
    data: facts.standout,
  });
  if (facts.comeback) cards.push({
    id: 'comeback', type: 'comeback', kicker: 'Resilience', title: facts.comeback.title,
    body: facts.comeback.explanation, accent: 'coral', shareSafe: true,
    accessibilitySummary: facts.comeback.explanation, data: facts.comeback,
  });
  if (facts.progressTrend) cards.push({
    id: 'progress', type: 'progress_trend', kicker: 'Progress trend', title: facts.progressTrend.label,
    body: facts.progressTrend.summary, accent: 'violet', shareSafe: !facts.progressTrend.private,
    accessibilitySummary: facts.progressTrend.summary, data: facts.progressTrend,
  });
  if (photo) cards.push({
    id: 'progress-photo', type: 'progress_photo', kicker: 'Private comparison', title: 'Your visual check-in',
    body: 'A date-labelled comparison you explicitly chose to include. No body judgement is applied.', accent: 'mint', shareSafe: false,
    accessibilitySummary: `Private progress photo comparison from ${photo.beforeDate} to ${photo.currentDate}.`, data: photo,
  });
  cards.push({
    id: 'coach', type: 'coach_insight', kicker: 'What your coach learned', title: facts.coachInsight.supported ? 'A pattern worth keeping' : 'Still learning your rhythm',
    body: facts.fallbackNarrative.coachInsight, accent: 'mint', shareSafe: false,
    accessibilitySummary: facts.fallbackNarrative.coachInsight,
    data: { supported: facts.coachInsight.supported, evidenceCount: facts.coachInsight.evidenceCount },
  });
  cards.push({
    id: 'achievement', type: 'achievement', kicker: 'Identity in motion', title: `Level ${facts.achievement.level} · ${facts.achievement.levelTitle}`,
    body: `${facts.achievement.xpEarned} XP earned from verified activity this week.`, accent: 'amber', shareSafe: true,
    accessibilitySummary: `Level ${facts.achievement.level}, ${facts.achievement.totalXp} total XP, ${facts.achievement.progressPct} percent toward the next level.`,
    data: facts.achievement,
  });
  cards.push({
    id: 'focus', type: 'next_focus', kicker: 'One focus for next week', title: facts.fallbackNarrative.nextFocusTitle,
    body: facts.fallbackNarrative.nextFocusExplanation, accent: 'lime', shareSafe: true,
    accessibilitySummary: `${facts.fallbackNarrative.nextFocusTitle}. ${facts.fallbackNarrative.nextFocusExplanation}`,
    data: { action: facts.nextFocus.action, target: facts.nextFocus.target, unit: facts.nextFocus.unit },
  });
  cards.push({
    id: 'share', type: 'share', kicker: 'Share the rhythm', title: facts.fallbackNarrative.closingLine,
    body: 'Review exactly what will appear before you export or share.', accent: 'lime', shareSafe: true,
    accessibilitySummary: `${facts.statistics.consistencyPct} percent consistency across ${facts.statistics.activeDays} active days.`,
    data: facts.privacySafeFacts,
  });
  while (cards.length > 10) {
    const repeatedTrend = cards.findIndex((card) => card.type === 'progress_trend' && card.data.kind === 'consistency');
    const unsupportedCoach = cards.findIndex((card) => card.type === 'coach_insight' && !card.data.supported);
    const activity = cards.findIndex((card) => card.type === 'activity');
    const removable = repeatedTrend >= 0 ? repeatedTrend : unsupportedCoach >= 0 ? unsupportedCoach : activity;
    if (removable < 0) break;
    cards.splice(removable, 1);
  }
  return cards;
}

export function buildWeeklyStory(input: WeeklyStoryPolicyInput): WeeklyStoryFacts {
  const currentDays = uniqueActivityDays(input.currentSignals).filter((date) => inRange(date, input.weekStart, input.weekEnd));
  const previousDays = uniqueActivityDays(input.previousSignals);
  const commitmentDays = clampCommitment(input.commitmentDays ?? input.memory?.context?.weeklyCommitmentDays ?? input.planDays);
  const consistencyPct = percentage(currentDays.length, commitmentDays);
  const previousConsistencyPct = percentage(previousDays.length, commitmentDays);
  const changePct = consistencyPct - previousConsistencyPct;
  const momentum: StoryTrend = changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat';
  const metrics = buildMetrics(input.currentSignals, currentDays.length);
  const comeback = detectComeback(input.currentSignals, input.previousSignals, input.weekStart, input.weekEnd);
  const standout = buildStandout(input, comeback, consistencyPct);
  const progressTrend = buildProgressTrend(input, consistencyPct, previousConsistencyPct);
  const coachInsight = buildCoachInsight(input);
  const nextFocus = buildNextFocus(input, comeback, consistencyPct, commitmentDays);
  const priorEarned = new Set(input.previousGamification.badges.filter((badge) => badge.earned).map((badge) => badge.id));
  const badgesUnlocked = input.gamification.badges
    .filter((badge) => badge.earned && !priorEarned.has(badge.id))
    .map((badge) => ({ id: badge.id, label: badge.label }));
  const nextBadgeSource = input.gamification.badges
    .filter((badge) => !badge.earned)
    .sort((a, b) => (b.progress / b.target) - (a.progress / a.target) || a.target - b.target)[0];
  const achievement: AchievementStoryCard['data'] = {
    xpEarned: Math.max(0, input.gamification.xp - input.previousGamification.xp),
    totalXp: input.gamification.xp,
    level: input.gamification.level,
    levelTitle: input.gamification.levelTitle,
    progressPct: input.gamification.progressPct,
    badgesUnlocked,
    ...(nextBadgeSource ? { nextBadge: { id: nextBadgeSource.id, label: nextBadgeSource.label, progress: nextBadgeSource.progress, target: nextBadgeSource.target } } : {}),
  };
  const label = formatRange(input.weekStart, input.weekEnd);
  const safeFirstName = input.firstName.trim().split(/\s+/)[0]?.slice(0, 40) || 'Athlete';
  const shareFacts: ShareStoryCard['data'] = {
    firstName: safeFirstName,
    dateRange: label,
    consistencyPct,
    activeDays: currentDays.length,
    workoutCount: workoutDays(input.currentSignals),
    level: input.gamification.level,
    ...(badgesUnlocked[0] ? { badge: badgesUnlocked[0].label } : {}),
    ...(comeback ? { comeback: `Returned after ${comeback.quietDays} quiet days` } : {}),
  };
  const coverHeadline = consistencyPct >= 100
    ? `${safeFirstName}, you kept your commitment.`
    : comeback
      ? `${safeFirstName}, you found your way back.`
      : currentDays.length === 1
        ? `${safeFirstName}, one promise stayed alive.`
        : `${safeFirstName}, you kept showing up.`;
  const fallbackNarrative: StoryNarrative = {
    coverHeadline,
    weekSummary: consistencyPct >= 100 ? 'You met the rhythm you chose—no extra volume required.' : currentDays.length === 1 ? 'This week was lighter, but one real action still counts.' : `You were active on ${currentDays.length} days and kept the week moving.`,
    standoutTitle: standout?.title ?? 'A real week, honestly told',
    standoutExplanation: standout?.explanation ?? 'There was no manufactured highlight—just the work you actually recorded.',
    coachInsight: coachInsight.text,
    nextFocusTitle: nextFocus.title,
    nextFocusExplanation: nextFocus.explanation,
    closingLine: comeback ? 'You are not starting over. You are continuing.' : 'Keep the rhythm. Let the results follow.',
  };
  const dataQuality: string[] = [];
  if (input.currentSignals.length === 0) dataQuality.push('No activity signals were recorded in this week.');
  if (input.progressLogs.length === 1) dataQuality.push('A single progress entry is not presented as a trend.');
  if (!coachInsight.supported) dataQuality.push('Coach insight uses an explicit insufficient-data fallback.');
  if (!input.memory) dataQuality.push('Coach Memory is not available; only recorded activity is used.');

  const withoutCards: Omit<WeeklyStoryFacts, 'cards'> = {
    eligible: input.currentSignals.length > 0 || input.progressLogs.some((log) => inRange(log.recordedDate, input.weekStart, input.weekEnd)),
    week: { start: input.weekStart, end: input.weekEnd, timezone: input.timezone, label },
    statistics: {
      activeDays: currentDays.length,
      commitmentDays,
      consistencyPct,
      previousConsistencyPct,
      changePct,
      currentStreak: input.gamification.consistency.currentStreak,
      longestStreak: input.gamification.consistency.longestStreak,
      momentum,
      metrics,
    },
    standout,
    comeback,
    progressTrend,
    coachInsight,
    achievement,
    nextFocus,
    privacySafeFacts: shareFacts,
    fallbackNarrative,
    dataQuality,
  };
  const cards = makeCards(withoutCards, safeFirstName, eligiblePhotoPair(input));
  return { ...withoutCards, cards };
}
