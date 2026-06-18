import { z } from 'zod';
import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { HabitsService } from '@/lib/services/habits/habits.service';

export const runtime = 'nodejs';

/** GET /api/v1/habits?date=YYYY-MM-DD → the day's five habits (value, goal, done). */
export async function GET(req: Request) {
  try {
    const ctx = await buildContext('web');
    const date = new URL(req.url).searchParams.get('date') || undefined;
    const day = await HabitsService.getDay(ctx, date);
    return ok(day);
  } catch (e) {
    return fail(e);
  }
}

const Body = z.object({
  habit: z.enum(['water', 'sleep', 'steps', 'meditation', 'stretch']),
  action: z.enum(['increment', 'set']).default('increment'),
  value: z.number().optional(),
  date: z.string().optional(),
});

/** POST /api/v1/habits → quick-tap increment or set an absolute value; returns the updated day. */
export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const body = Body.parse(await req.json());
    const day =
      body.action === 'set'
        ? await HabitsService.setHabit(ctx, body.habit, body.value ?? 0, body.date)
        : await HabitsService.increment(ctx, body.habit, body.date);
    return ok(day);
  } catch (e) {
    return fail(e);
  }
}
