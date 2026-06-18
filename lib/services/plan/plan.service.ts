import type { OptionalUnlessRequiredId } from 'mongodb';
import type { AuthContext } from '@/lib/core/context';
import { getCollection, OwnedRepository, type OwnedDoc } from '@/lib/db/repository';
import { runAITask } from '@/lib/ai/router';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { Equipment, PlanDay, PlanExercise, WorkoutPlanDoc } from './types';

const PLANS = 'workout_plans';
const COMPLETIONS = 'workout_completions';

interface WorkoutCompletionDoc extends OwnedDoc {
  date: string;
  exerciseName: string;
}

const completionsRepo = new OwnedRepository<WorkoutCompletionDoc>(COMPLETIONS);

interface RawExercise {
  name?: string;
  sets?: number;
  reps?: string | number;
  rest_seconds?: number;
  muscle_group?: string;
  tip?: string;
}
interface RawDay {
  day?: string | number;
  focus?: string;
  exercises?: RawExercise[];
}

export function mapEquipment(equipment?: string[]): Equipment {
  if (!equipment || equipment.length === 0) return 'none';
  if (equipment.includes('gym')) return 'gym';
  if (equipment.some((e) => ['home_gym', 'dumbbells', 'bands'].includes(e))) return 'home';
  return 'none';
}

function weekStart(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function parsePlan(raw: string): PlanDay[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return (data as RawDay[])
      .map((d, i) => ({
        day: String(d.day ?? `Day ${i + 1}`),
        focus: d.focus,
        exercises: (d.exercises ?? []).map(
          (e): PlanExercise => ({
            name: e.name ?? 'Exercise',
            sets: typeof e.sets === 'number' ? e.sets : 3,
            reps: e.reps ?? '8-12',
            restSeconds: typeof e.rest_seconds === 'number' ? e.rest_seconds : 60,
            muscleGroup: e.muscle_group ?? 'Full body',
            tip: e.tip ?? '',
          }),
        ),
      }))
      .filter((d) => d.exercises.length > 0);
  } catch {
    return [];
  }
}

function fallbackPlan(): PlanDay[] {
  return [
    {
      day: 'Day 1',
      focus: 'Full Body',
      exercises: [
        { name: 'Bodyweight Squats', sets: 3, reps: '12-15', restSeconds: 60, muscleGroup: 'Legs', tip: 'Chest up, drive through your heels.' },
        { name: 'Push-ups', sets: 3, reps: '8-12', restSeconds: 60, muscleGroup: 'Chest', tip: 'Keep a straight line from head to heels.' },
        { name: 'Plank', sets: 3, reps: '30-45s', restSeconds: 45, muscleGroup: 'Core', tip: 'Squeeze glutes and brace your core.' },
      ],
    },
  ];
}

export const PlanService = {
  async generate(
    clerkUserId: string,
    profile: { goal?: string; experience?: string; equipment?: string[]; daysPerWeek?: number; mode?: string },
  ): Promise<WorkoutPlanDoc> {
    const days = profile.daysPerWeek ?? 4;
    const goal = profile.goal ?? 'general fitness';
    const experience = profile.experience ?? 'beginner';
    const equip = mapEquipment(profile.equipment);

    const prompt = `Generate a ${days}-day workout plan for a ${experience} level person with goal: ${goal}. Equipment: ${equip}. Return ONLY a JSON array of days; each day has "day", "focus" and "exercises" (each exercise: name, sets, reps, rest_seconds, muscle_group, tip).`;

    const raw = await runAITask('plan_json', prompt, { json: true });
    let parsed = parsePlan(raw);
    const generatedBy: WorkoutPlanDoc['generatedBy'] = parsed.length > 0 ? 'ai' : 'fallback';
    if (parsed.length === 0) parsed = fallbackPlan();

    const doc: WorkoutPlanDoc = {
      clerkUserId,
      weekOf: weekStart(),
      days: parsed,
      mode: profile.mode ?? 'normal',
      generatedBy,
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const coll = await getCollection<WorkoutPlanDoc>(PLANS);
    await coll.insertOne(doc as unknown as OptionalUnlessRequiredId<WorkoutPlanDoc>);
    return doc;
  },

  /** The current Living Plan = the most recently created active plan. */
  async getCurrent(clerkUserId: string): Promise<WorkoutPlanDoc | null> {
    const coll = await getCollection<WorkoutPlanDoc>(PLANS);
    const arr = await coll
      .find({ clerkUserId, isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    return (arr[0] as WorkoutPlanDoc) ?? null;
  },

  /** Names of exercises the user has checked off for a given date. */
  async getCompletions(clerkUserId: string, date: string): Promise<string[]> {
    const coll = await getCollection<WorkoutCompletionDoc>(COMPLETIONS);
    const arr = await coll.find({ clerkUserId, date }).toArray();
    return arr.map((c) => c.exerciseName);
  },

  /** Toggle an exercise completion for a date; emits a workout signal when completed. */
  async setCompletion(
    ctx: AuthContext,
    input: { exerciseName: string; date: string; done: boolean },
  ): Promise<void> {
    const coll = await getCollection<WorkoutCompletionDoc>(COMPLETIONS);
    if (input.done) {
      const existing = await coll.findOne({ clerkUserId: ctx.clerkUserId, date: input.date, exerciseName: input.exerciseName });
      if (!existing) {
        await completionsRepo.create(ctx.clerkUserId, { date: input.date, exerciseName: input.exerciseName });
        await MemoryService.recordSignal({
          clerkUserId: ctx.clerkUserId,
          source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
          type: 'workout_logged',
          payload: { exerciseName: input.exerciseName, date: input.date },
          occurredAt: new Date(),
        });
      }
    } else {
      await coll.deleteMany({ clerkUserId: ctx.clerkUserId, date: input.date, exerciseName: input.exerciseName });
    }
  },
};
