import type { CoachMemory, CoachMode } from '@/lib/services/memory/types';
import type { TodaySignals } from '@/lib/services/today/types';

function dateInRange(date: string, from: string, to: string): boolean {
  const d = new Date(date).getTime();
  return d >= new Date(from).getTime() && d <= new Date(to).getTime();
}

/**
 * Deterministic mode detection — the brain behind Exam/Life Mode and the Comeback system.
 * Pure function: given memory + today's signals, decide the coaching mode. No LLM, fully
 * testable. See docs/architecture/02 §6-7.
 */
export function detectMode(memory: CoachMemory | null, signals: TodaySignals): CoachMode {
  const events = memory?.context?.lifeContext?.academicEvents ?? [];
  if (events.some((e) => dateInRange(signals.date, e.from, e.to))) return 'exam';

  const c = signals.checkin;
  if (c?.sick) return 'illness';
  if (c?.traveling) return 'travel';
  if (c?.busy || (typeof c?.timeMinutes === 'number' && c.timeMinutes <= 15)) return 'busy';

  if (signals.daysSinceLastActivity >= 4) return 'comeback';

  if (
    c &&
    ((typeof c.energy === 'number' && c.energy <= 2) ||
      (typeof c.sleepHours === 'number' && c.sleepHours < 5))
  ) {
    return 'deload';
  }

  return 'normal';
}
