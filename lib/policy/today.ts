import type { CoachMemory } from '@/lib/services/memory/types';
import type { WorkoutPlanDoc, PlanDay } from '@/lib/services/plan/types';
import type { TodayCard, TodaySignals, PrimaryActionKind } from '@/lib/services/today/types';
import { detectMode } from './mode';

function pickDay(plan: WorkoutPlanDoc, date: string): PlanDay {
  const len = plan.days.length || 1;
  const idx = new Date(date).getDay() % len;
  return plan.days[idx] ?? plan.days[0];
}

function momentum(memory: CoachMemory | null): { label: string; level: number } {
  const trend = memory?.derived?.consistencyTrend ?? 'flat';
  if (trend === 'up') return { label: 'On a roll', level: 4 };
  if (trend === 'down') return { label: 'Rebuilding', level: 2 };
  return { label: 'Steady', level: 3 };
}

/**
 * Decide the single adaptive "Today" card from memory + plan + today's signals.
 * Pure + deterministic — the LLM only rephrases this output into the user's voice later.
 * This is the core of the "the app does the thinking" bet (vision §5.2, §5.7).
 */
export function decideTodayShape(
  memory: CoachMemory | null,
  plan: WorkoutPlanDoc,
  signals: TodaySignals,
): TodayCard {
  const mode = detectMode(memory, signals);
  const session = pickDay(plan, signals.date);
  const allExercises = session.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps }));

  let kind: PrimaryActionKind = 'workout';
  let title = session.focus ? `${session.focus} session` : 'Today\u2019s session';
  let durationMin = 40;
  let exercises = allExercises;
  let why = 'You\u2019re on track \u2014 here\u2019s your full session for today.';

  switch (mode) {
    case 'exam':
      kind = 'workout';
      title = 'Exam-mode 10-min reset';
      durationMin = 10;
      exercises = allExercises.slice(0, 3);
      why = 'Exams detected \u2014 keeping it to 10 minutes to protect your routine and focus, not chase gains. Streak protected.';
      break;
    case 'busy':
      kind = 'workout';
      title = 'Quick 12-min session';
      durationMin = 12;
      exercises = allExercises.slice(0, 3);
      why = 'You\u2019re short on time today \u2014 a focused 12 minutes keeps your momentum alive.';
      break;
    case 'travel':
      kind = 'workout';
      title = 'Travel bodyweight flow';
      durationMin = 20;
      exercises = allExercises.slice(0, 4);
      why = 'On the move \u2014 a no-equipment session you can do anywhere.';
      break;
    case 'illness':
      kind = 'recovery';
      title = 'Rest & gentle mobility';
      durationMin = 15;
      exercises = [];
      why = 'You\u2019re under the weather \u2014 recovery today. Your streak is protected.';
      break;
    case 'deload':
      kind = 'recovery';
      title = 'Light recovery day';
      durationMin = 20;
      exercises = allExercises.slice(0, 2);
      why = 'Low energy or sleep \u2014 dialing it back so you bounce back stronger.';
      break;
    case 'comeback':
      kind = 'comeback';
      title = 'Welcome back \u2014 ease in';
      durationMin = 12;
      exercises = allExercises.slice(0, 2);
      why = 'You\u2019ve been away a few days. Just 12 minutes to get back in \u2014 you\u2019ve done this before.';
      break;
    default:
      break;
  }

  const greeting = mode === 'comeback' ? 'Good to see you again' : 'Let\u2019s get it';

  return {
    date: signals.date,
    mode,
    greeting,
    primaryAction: { kind, title, durationMin, exercises },
    why,
    quickLogs: ['workout', 'meal', 'water', 'weight'],
    momentum: momentum(memory),
  };
}
