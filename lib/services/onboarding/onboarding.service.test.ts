import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthContext } from '@/lib/core/context';
import { getCollection } from '@/lib/db/repository';
import { completeOnboarding } from './onboarding.service';

beforeEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.MONGODB_URI;
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

describe('completeOnboarding', () => {
  it('is idempotent after the profile and first plan have been saved', async () => {
    const clerkUserId = `onboarding-user-${crypto.randomUUID()}`;
    const ctx: AuthContext = { clerkUserId, role: 'user', plan: 'free', source: 'web' };
    const input = {
      goal: 'general fitness',
      experience: 'beginner',
      activityLevel: 'moderate',
      daysPerWeek: 3,
      gender: 'male',
      age: 28,
      heightCm: 175,
      weightKg: 72,
      equipment: ['bodyweight'],
      dietType: 'non_veg',
      language: 'english',
    };

    const first = await completeOnboarding(ctx, input);
    const second = await completeOnboarding(ctx, input);

    expect(first).toMatchObject({ onboarded: true, alreadyComplete: false });
    expect(second).toMatchObject({ onboarded: true, alreadyComplete: true });

    const plans = await getCollection<Record<string, unknown>>('workout_plans');
    const planRows = await plans.find({ clerkUserId }).toArray();
    expect(planRows).toHaveLength(1);

    const signals = await getCollection<Record<string, unknown>>('memory_signals');
    const signalRows = await signals.find({ clerkUserId }).toArray();
    expect(signalRows).toHaveLength(1);
  });
});
