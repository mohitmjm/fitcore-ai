import { computeGamification, type GamificationState, type XPEvent } from './gamification';

const DAY_MS = 86_400_000;
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

export type WorldZoneId = 'foundation' | 'strength' | 'endurance' | 'mobility' | 'nutrition' | 'recovery' | 'elite';
export type MissionKind = 'training' | 'movement' | 'nutrition' | 'recovery' | 'consistency';

export interface WorldSignal extends XPEvent {
  type: string;
}

export interface WorldHabit {
  habit: 'water' | 'sleep' | 'steps' | 'meditation' | 'stretch';
  value: number;
  goal: number;
  unit: string;
  done: boolean;
}

export interface WorldReadiness {
  score: number;
  band: 'recover' | 'reset' | 'steady' | 'push';
  title: string;
  message: string;
}

export interface WorldMission {
  id: string;
  title: string;
  description: string;
  kind: MissionKind;
  progress: number;
  target: number;
  unit: string;
  xpReward: number;
  completed: boolean;
  actionHref: string;
}

export interface PerformanceMetric {
  id: 'strength' | 'endurance' | 'mobility' | 'recovery' | 'nutrition' | 'consistency';
  label: string;
  score: number;
  trend: 'building' | 'steady' | 'strong';
}

export interface WorldZone {
  id: WorldZoneId;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  requirement: string;
}

export interface FitnessProjection {
  horizonWeeks: number;
  strengthRange: [number, number];
  enduranceRange: [number, number];
  consistencyRange: [number, number];
  milestone: string;
  disclaimer: string;
}

export interface FitnessWorldState {
  generatedAt: string;
  game: GamificationState;
  metrics: PerformanceMetric[];
  zones: WorldZone[];
  dailyMissions: WorldMission[];
  weeklyQuests: WorldMission[];
  boss: {
    id: string;
    name: string;
    title: string;
    health: number;
    damage: number;
    target: number;
    rewardXp: number;
    completed: boolean;
    checklist: string[];
  };
  avatar: {
    rank: string;
    theme: 'foundation' | 'momentum' | 'performance' | 'elite';
    outfit: string;
    accessory: string;
  };
  projection: FitnessProjection;
  journey: { current: string; next: string; unlockedCount: number; totalZones: number };
  coachMessage: string;
}

export interface BuildWorldInput {
  now: Date;
  signals: WorldSignal[];
  habits: WorldHabit[];
  readiness?: WorldReadiness | null;
  goal?: string;
  weeklyCommitmentDays?: number;
  plannedExerciseCount?: number;
}

function dayKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function count(events: WorldSignal[], type: string): number {
  return events.filter((event) => event.type === type).length;
}

function distinctDays(events: WorldSignal[], type?: string): number {
  return new Set(events.filter((event) => !type || event.type === type).map((event) => dayKey(event.occurredAt))).size;
}

function metric(id: PerformanceMetric['id'], label: string, score: number): PerformanceMetric {
  const safe = clamp(score);
  return { id, label, score: safe, trend: safe >= 76 ? 'strong' : safe >= 36 ? 'steady' : 'building' };
}

function mission(input: Omit<WorldMission, 'completed'>): WorldMission {
  return { ...input, progress: Math.min(input.progress, input.target), completed: input.progress >= input.target };
}

export function buildFitnessWorld(input: BuildWorldInput): FitnessWorldState {
  const today = input.now.toISOString().slice(0, 10);
  const weekStart = +input.now - 6 * DAY_MS;
  const todaySignals = input.signals.filter((event) => dayKey(event.occurredAt) === today);
  const weekSignals = input.signals.filter((event) => +new Date(event.occurredAt) >= weekStart);
  const signalTypes = input.signals.map((event) => event.type);
  const activityDates = input.signals.map((event) => dayKey(event.occurredAt));
  const game = computeGamification({ signalTypes, activityDates, today, events: input.signals });
  const habits = new Map(input.habits.map((habit) => [habit.habit, habit]));
  const workoutDays = distinctDays(input.signals, 'workout_logged');
  const weekWorkoutDays = distinctDays(weekSignals, 'workout_logged');
  const mobilityLogs = input.signals.filter((event) => event.type === 'habit_logged' && event.payload?.habit === 'stretch').length;
  const sleepLogs = count(input.signals, 'sleep_logged');
  const mealLogs = count(input.signals, 'meal_logged');
  const waterLogs = count(input.signals, 'water_logged');
  // No check-in means no recovery unlock: a new member begins in Foundation Zone as promised.
  const readinessScore = input.readiness?.score ?? 20;
  const stepHabit = habits.get('steps');

  const metrics: PerformanceMetric[] = [
    metric('strength', 'Strength', 14 + workoutDays * 5 + Math.min(12, count(input.signals, 'plan_feedback') * 2)),
    metric('endurance', 'Endurance', 12 + workoutDays * 3 + (stepHabit ? (stepHabit.value / Math.max(1, stepHabit.goal)) * 22 : 0)),
    metric('mobility', 'Mobility', 12 + mobilityLogs * 6 + (habits.get('stretch')?.done ? 12 : 0)),
    metric('recovery', 'Recovery', readinessScore * 0.72 + Math.min(24, sleepLogs * 3)),
    metric('nutrition', 'Nutrition', 12 + mealLogs * 2.5 + Math.min(18, waterLogs * 2)),
    metric('consistency', 'Consistency', game.consistency.monthPct),
  ];
  const score = (id: PerformanceMetric['id']) => metrics.find((item) => item.id === id)?.score ?? 0;

  const dailyMissions: WorldMission[] = [
    mission({
      id: 'daily_training', title: input.plannedExerciseCount ? 'Complete today’s training' : 'Choose one movement',
      description: input.readiness?.band === 'recover' ? 'Recovery guidance replaces hard training today.' : 'Every completed planned movement moves your world forward.',
      kind: 'training', progress: count(todaySignals, 'workout_logged'), target: input.readiness?.band === 'recover' ? 1 : Math.max(1, input.plannedExerciseCount ?? 1), unit: 'movements', xpReward: 40, actionHref: input.plannedExerciseCount ? '/workout' : '/exercises',
    }),
    mission({
      id: 'daily_water', title: 'Hit your hydration target', description: 'Steady hydration supports training and recovery.', kind: 'nutrition',
      progress: habits.get('water')?.value ?? 0, target: habits.get('water')?.goal ?? 8, unit: habits.get('water')?.unit ?? 'glasses', xpReward: 12, actionHref: '/today',
    }),
    mission({
      id: 'daily_mobility', title: 'Five-minute mobility reset', description: 'A short range-of-motion session counts—even on rest days.', kind: 'recovery',
      progress: habits.get('stretch')?.value ?? 0, target: habits.get('stretch')?.goal ?? 10, unit: habits.get('stretch')?.unit ?? 'min', xpReward: 15, actionHref: '/today',
    }),
    mission({
      id: 'daily_steps', title: 'Build your movement rhythm', description: 'Accumulate comfortable movement across the day.', kind: 'movement',
      progress: habits.get('steps')?.value ?? 0, target: habits.get('steps')?.goal ?? 8000, unit: 'steps', xpReward: 18, actionHref: '/today',
    }),
  ];

  const commitment = Math.max(2, Math.min(6, input.weeklyCommitmentDays ?? 3));
  const recoveryDays = distinctDays(weekSignals.filter((event) => event.type === 'sleep_logged' || (event.type === 'habit_logged' && event.payload?.habit === 'stretch')));
  const nutritionDays = distinctDays(weekSignals, 'meal_logged');
  const weeklyQuests: WorldMission[] = [
    mission({ id: 'weekly_training', title: 'Keep your weekly promise', description: `${commitment} training days matches the commitment in your profile.`, kind: 'consistency', progress: weekWorkoutDays, target: commitment, unit: 'days', xpReward: 120, actionHref: '/workout' }),
    mission({ id: 'weekly_recovery', title: 'Protect two recovery days', description: 'Sleep or mobility logs count. Recovery is part of training.', kind: 'recovery', progress: recoveryDays, target: 2, unit: 'days', xpReward: 70, actionHref: '/today' }),
    mission({ id: 'weekly_nutrition', title: 'Build a fuel rhythm', description: 'Log meals on five days—awareness, not perfection.', kind: 'nutrition', progress: nutritionDays, target: 5, unit: 'days', xpReward: 90, actionHref: '/diet' }),
    mission({ id: 'weekly_active', title: 'Five active days', description: 'Any genuine fitness action protects your overall rhythm.', kind: 'movement', progress: distinctDays(weekSignals), target: 5, unit: 'days', xpReward: 100, actionHref: '/today' }),
  ];

  const zoneDefinitions: Array<[WorldZoneId, string, string, number, PerformanceMetric['id'] | 'level']> = [
    ['foundation', 'Foundation Zone', 'Build the repeatable basics that make every later result possible.', 0, 'consistency'],
    ['strength', 'Strength Arena', 'Progressive training, personal records, and resilient technique.', 28, 'strength'],
    ['endurance', 'Endurance Track', 'Movement capacity, conditioning, and sustainable pace.', 30, 'endurance'],
    ['mobility', 'Mobility Garden', 'Joint range, movement quality, and pain-aware practice.', 30, 'mobility'],
    ['nutrition', 'Nutrition Lab', 'Practical fuel habits without compulsory calorie counting.', 32, 'nutrition'],
    ['recovery', 'Recovery Sanctuary', 'Sleep, readiness, mobility, and comeback protection.', 35, 'recovery'],
    ['elite', 'Elite Zone', 'A long-horizon training identity built through consistency.', 36, 'level'],
  ];
  const zones: WorldZone[] = zoneDefinitions.map(([id, name, description, requirement, source]) => {
    const progress = source === 'level' ? game.level : score(source);
    return { id, name, description, unlocked: id === 'foundation' || progress >= requirement, progress: requirement ? clamp((progress / requirement) * 100) : 100, requirement: source === 'level' ? `Reach level ${requirement}` : `Build ${source} to ${requirement}` };
  });

  const activeDays = distinctDays(weekSignals);
  const bossCompleted = activeDays >= 5;
  const weakest = [...metrics].filter((item) => item.id !== 'consistency').sort((a, b) => a.score - b.score)[0];
  const bossNames: Record<PerformanceMetric['id'], [string, string]> = {
    strength: ['Foundation Breaker', 'Rebuild strength with deliberate sessions'],
    endurance: ['Cardio Titan', 'Win through sustainable active days'],
    mobility: ['Mobility Lock', 'Open the week with regular movement'],
    recovery: ['Recovery Thief', 'Protect energy instead of borrowing it'],
    nutrition: ['Fuel Drift', 'Restore a simple nutrition rhythm'],
    consistency: ['Sedentary Beast', 'Build a repeatable week'],
  };
  const [bossName, bossTitle] = bossNames[weakest?.id ?? 'consistency'];

  const adherence = game.consistency.monthPct / 100;
  const projection: FitnessProjection = {
    horizonWeeks: 12,
    strengthRange: [clamp(score('strength') + 8 + adherence * 8), clamp(score('strength') + 16 + adherence * 16)],
    enduranceRange: [clamp(score('endurance') + 7 + adherence * 7), clamp(score('endurance') + 14 + adherence * 15)],
    consistencyRange: [clamp(game.consistency.monthPct + 5), clamp(game.consistency.monthPct + 18)],
    milestone: adherence >= 0.65 ? 'You are trending toward a stable performance phase.' : 'Your next milestone is a repeatable two-week rhythm.',
    disclaimer: 'Projection ranges use your current activity pattern. They are motivational estimates, not medical or transformation guarantees.',
  };

  const unlocked = zones.filter((zone) => zone.unlocked);
  const next = zones.find((zone) => !zone.unlocked);
  const avatarTheme = game.level >= 51 ? 'elite' : game.level >= 21 ? 'performance' : game.level >= 6 ? 'momentum' : 'foundation';
  const daysSinceActivity = activityDates.length ? Math.floor((+input.now - Math.max(...input.signals.map((event) => +new Date(event.occurredAt)))) / DAY_MS) : 0;
  const coachMessage = daysSinceActivity >= 4
    ? 'No punishment. Your previous progress still matters—restart with one short mission today.'
    : input.readiness?.band === 'recover'
      ? 'Recovery is productive today. Keep the habit small and let your body catch up.'
      : dailyMissions.some((item) => item.completed)
        ? 'You have already moved the world forward today. The next mission is optional, not owed.'
        : `Start with ${dailyMissions[0].title.toLowerCase()}. One clear win is enough.`;

  return {
    generatedAt: input.now.toISOString(), game, metrics, zones, dailyMissions, weeklyQuests,
    boss: {
      id: `boss_${weakest?.id ?? 'consistency'}`, name: bossName, title: bossTitle,
      health: clamp(100 - (activeDays / 5) * 100), damage: activeDays, target: 5, rewardXp: 180, completed: bossCompleted,
      checklist: ['Complete five active days', 'Include one recovery action', 'Finish without unsafe max-effort attempts'],
    },
    avatar: { rank: game.levelTitle, theme: avatarTheme, outfit: game.level >= 11 ? 'Performance kit' : 'Foundation kit', accessory: game.level >= 21 ? 'Athlete crest' : game.level >= 6 ? 'Momentum band' : 'Starter band' },
    projection,
    journey: { current: unlocked.at(-1)?.name ?? 'Foundation Zone', next: next?.name ?? 'Fitcore Legend', unlockedCount: unlocked.length, totalZones: zones.length },
    coachMessage,
  };
}
