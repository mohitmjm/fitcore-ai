import type { ReadinessBand } from '@/lib/services/readiness/types';

export type MomentumQuestKind = 'strength' | 'movement' | 'recovery';
export type MomentumQuestAccent = 'lime' | 'violet' | 'mint';

export interface MomentumQuest {
  id: string;
  kind: MomentumQuestKind;
  title: string;
  description: string;
  durationMinutes: number;
  xpReward: number;
  steps: string[];
  coachCue: string;
  completionPrompt: string;
  accent: MomentumQuestAccent;
  recommended: boolean;
  recommendationReason?: string;
}

export interface MomentumCompletionFact {
  date: string;
  questId: string;
  kind: MomentumQuestKind;
  title: string;
  durationMinutes: number;
  xpReward: number;
  completedAt: string;
}

export interface MomentumPathDay {
  date: string;
  dayLabel: string;
  dayNumber: number;
  status: 'complete' | 'today' | 'open';
  kind?: MomentumQuestKind;
}

export interface MomentumExperience {
  date: string;
  readiness: { band: ReadinessBand; score?: number };
  coachPulse: { eyebrow: string; title: string; message: string };
  quests: MomentumQuest[];
  recommendedQuestId: string;
  completedToday?: MomentumCompletionFact;
  streak: {
    current: number;
    best: number;
    totalQuests: number;
    activeDaysLast7: number;
  };
  path: MomentumPathDay[];
  crewBoost?: { text: string; sharePath: '/momentum' };
}

export interface MomentumPolicyInput {
  date: string;
  readiness?: { band: ReadinessBand; score: number } | null;
  completions: MomentumCompletionFact[];
}

interface QuestTemplate {
  key: string;
  title: string;
  description: string;
  steps: string[];
  coachCue: string;
  completionPrompt: string;
}

const QUEST_TEMPLATES: Record<MomentumQuestKind, QuestTemplate[]> = {
  strength: [
    {
      key: 'first-rep-circuit',
      title: 'First Rep Circuit',
      description: 'A compact, form-first strength loop that makes starting the whole win.',
      steps: ['8 controlled sit-to-stands or squats', '6 wall or incline push-ups', '20-second dead-bug hold', 'Repeat only while form feels smooth'],
      coachCue: 'Move slowly enough that every rep feels owned.',
      completionPrompt: 'Strong work. You chose quality over volume.',
    },
    {
      key: 'posture-power',
      title: 'Posture Power',
      description: 'Build the back-side strength that supports everyday movement.',
      steps: ['8 glute bridges', '6 bird-dogs per side', '20-second supported wall sit', 'Finish with three relaxed breaths'],
      coachCue: 'Keep your ribs quiet and let control set the pace.',
      completionPrompt: 'That was a real strength deposit.',
    },
    {
      key: 'steady-base',
      title: 'Steady Base',
      description: 'Simple lower-body and core work with no equipment required.',
      steps: ['8 supported reverse steps per side', '10 hip hinges', '20-second elevated plank', 'Repeat at a comfortable effort'],
      coachCue: 'Leave a little energy in reserve. Consistency needs tomorrow too.',
      completionPrompt: 'Base built. Momentum protected.',
    },
  ],
  movement: [
    {
      key: 'walk-reset',
      title: 'Walk Reset',
      description: 'A short walk with just enough structure to clear the mental fog.',
      steps: ['Start at an easy pace', 'Add three one-minute brisk sections', 'Relax your shoulders and look ahead', 'Finish easy for one minute'],
      coachCue: 'Let the first two minutes be almost too easy.',
      completionPrompt: 'You turned screen time into movement time.',
    },
    {
      key: 'movement-snack',
      title: 'Movement Snack',
      description: 'A small indoor movement break for busy or weather-heavy days.',
      steps: ['March comfortably for one minute', 'Take 10 side steps each way', 'Circle shoulders and reach tall', 'Repeat the sequence without rushing'],
      coachCue: 'This is a reset, not a test.',
      completionPrompt: 'Small session, real signal.',
    },
    {
      key: 'fresh-air-loop',
      title: 'Fresh-Air Loop',
      description: 'Step outside, change context, and return with more energy than you spent.',
      steps: ['Choose a familiar short loop', 'Walk tall at a conversational pace', 'Notice three things away from a screen', 'Return before the effort feels heavy'],
      coachCue: 'The goal is to come back refreshed, not flattened.',
      completionPrompt: 'Loop closed. Day changed.',
    },
  ],
  recovery: [
    {
      key: 'mobility-reset',
      title: 'Mobility Reset',
      description: 'Gentle range-of-motion work that keeps recovery inside the plan.',
      steps: ['Take five slow shoulder circles each way', 'Perform eight comfortable hip hinges', 'Rock ankles forward gently six times per side', 'Finish with four long exhales'],
      coachCue: 'Nothing should be forced. Comfortable range is the target.',
      completionPrompt: 'Recovery counted because recovery is training.',
    },
    {
      key: 'desk-undo',
      title: 'Desk Undo',
      description: 'Release the positions that build up during a screen-heavy day.',
      steps: ['Open and close your hands ten times', 'Turn your upper body gently each way', 'Stand tall and reach overhead', 'Walk around for one easy minute'],
      coachCue: 'Breathe normally and stay well inside a pain-free range.',
      completionPrompt: 'Tension down. Momentum still up.',
    },
    {
      key: 'downshift',
      title: 'Downshift',
      description: 'A calm nervous-system reset for low-energy or high-stress days.',
      steps: ['Sit or lie somewhere supported', 'Inhale gently for four counts', 'Exhale comfortably for six counts', 'Repeat for six unforced breaths'],
      coachCue: 'If counting feels uncomfortable, simply make the exhale a little longer.',
      completionPrompt: 'You listened early instead of waiting to crash.',
    },
  ],
};

const DURATION_BY_BAND: Record<ReadinessBand, Record<MomentumQuestKind, number>> = {
  recover: { strength: 4, movement: 6, recovery: 5 },
  reset: { strength: 6, movement: 8, recovery: 6 },
  steady: { strength: 10, movement: 12, recovery: 8 },
  push: { strength: 12, movement: 15, recovery: 8 },
};

const XP_BY_KIND: Record<MomentumQuestKind, number> = {
  strength: 12,
  movement: 12,
  recovery: 12,
};

const ACCENT_BY_KIND: Record<MomentumQuestKind, MomentumQuestAccent> = {
  strength: 'lime',
  movement: 'violet',
  recovery: 'mint',
};

const COACH_PULSE: Record<ReadinessBand, MomentumExperience['coachPulse']> = {
  recover: {
    eyebrow: 'Protect the comeback',
    title: 'Care is the productive choice today.',
    message: 'Recovery is recommended. One gentle action keeps the relationship with movement intact.',
  },
  reset: {
    eyebrow: 'Lower the friction',
    title: 'Keep the habit, lower the load.',
    message: 'A short reset is enough today. Finish with more capacity than you started with.',
  },
  steady: {
    eyebrow: 'Build the rhythm',
    title: 'Your signals support a useful, repeatable session.',
    message: 'Choose the lane that feels easiest to start. The app balances the week around your choice.',
  },
  push: {
    eyebrow: 'Use the good day',
    title: 'You have room for a little challenge.',
    message: 'Strength is recommended unless you have already leaned on it recently. Great form stays the priority.',
  },
};

export function shiftMomentumDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function daySeed(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

function recommendedKind(input: MomentumPolicyInput, band: ReadinessBand): MomentumQuestKind {
  if (band === 'recover' || band === 'reset') return 'recovery';
  const recentStart = shiftMomentumDate(input.date, -6);
  const recent = input.completions.filter((item) => item.date >= recentStart && item.date <= input.date);
  if (band === 'push') {
    const strengthWasRecent = recent.some((item) => item.kind === 'strength' && item.date >= shiftMomentumDate(input.date, -2));
    return strengthWasRecent ? 'movement' : 'strength';
  }

  const counts: Record<MomentumQuestKind, number> = { strength: 0, movement: 0, recovery: 0 };
  recent.forEach((item) => { counts[item.kind] += 1; });
  const rotation: MomentumQuestKind[] = ['strength', 'movement', 'recovery'];
  const offset = daySeed(input.date) % rotation.length;
  const ordered = [...rotation.slice(offset), ...rotation.slice(0, offset)];
  return ordered.sort((a, b) => counts[a] - counts[b])[0];
}

function currentStreak(dates: Set<string>, today: string): number {
  let cursor = dates.has(today) ? today : shiftMomentumDate(today, -1);
  if (!dates.has(cursor)) return 0;
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = shiftMomentumDate(cursor, -1);
  }
  return count;
}

function bestStreak(completions: MomentumCompletionFact[]): number {
  const dates = [...new Set(completions.map((item) => item.date))].sort();
  let best = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of dates) {
    run = previous && shiftMomentumDate(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

function questFor(kind: MomentumQuestKind, input: MomentumPolicyInput, band: ReadinessBand, recommended: MomentumQuestKind): MomentumQuest {
  const templates = QUEST_TEMPLATES[kind];
  const template = templates[daySeed(input.date) % templates.length];
  const isRecommended = kind === recommended;
  const reason = band === 'recover' || band === 'reset'
    ? 'Matches today\'s recovery signals'
    : band === 'push' && kind === 'strength'
      ? 'Uses today\'s stronger readiness'
      : 'Balances your recent quest mix';
  return {
    id: `${input.date}:${kind}:${template.key}`,
    kind,
    title: template.title,
    description: template.description,
    durationMinutes: DURATION_BY_BAND[band][kind],
    xpReward: XP_BY_KIND[kind],
    steps: template.steps,
    coachCue: template.coachCue,
    completionPrompt: template.completionPrompt,
    accent: ACCENT_BY_KIND[kind],
    recommended: isRecommended,
    ...(isRecommended ? { recommendationReason: reason } : {}),
  };
}

export function buildMomentumExperience(input: MomentumPolicyInput): MomentumExperience {
  const readiness = input.readiness ?? { band: 'steady' as const, score: undefined };
  const recommended = recommendedKind(input, readiness.band);
  const quests = (['strength', 'movement', 'recovery'] as MomentumQuestKind[])
    .map((kind) => questFor(kind, input, readiness.band, recommended));
  const completedToday = input.completions.find((item) => item.date === input.date);
  const completionByDate = new Map(input.completions.map((item) => [item.date, item]));
  const dates = new Set(input.completions.map((item) => item.date));
  const path = Array.from({ length: 7 }, (_, index) => shiftMomentumDate(input.date, index - 6)).map((date) => {
    const completion = completionByDate.get(date);
    const parsed = new Date(`${date}T00:00:00Z`);
    return {
      date,
      dayLabel: parsed.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }).slice(0, 1),
      dayNumber: parsed.getUTCDate(),
      status: completion ? 'complete' as const : date === input.date ? 'today' as const : 'open' as const,
      ...(completion ? { kind: completion.kind } : {}),
    };
  });
  const activeDaysLast7 = path.filter((item) => item.status === 'complete').length;

  return {
    date: input.date,
    readiness,
    coachPulse: COACH_PULSE[readiness.band],
    quests,
    recommendedQuestId: quests.find((quest) => quest.recommended)?.id ?? quests[0].id,
    ...(completedToday ? { completedToday } : {}),
    streak: {
      current: currentStreak(dates, input.date),
      best: bestStreak(input.completions),
      totalQuests: input.completions.length,
      activeDaysLast7,
    },
    path,
    ...(completedToday ? {
      crewBoost: {
        text: `I kept my momentum with a ${completedToday.durationMinutes}-minute ${completedToday.kind} quest on FitCore. One real action—your turn.`,
        sharePath: '/momentum' as const,
      },
    } : {}),
  };
}
