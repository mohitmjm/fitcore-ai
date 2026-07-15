import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { UsersService } from '@/lib/services/users/users.service';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { PlanService } from '@/lib/services/plan/plan.service';

export const OnboardingInput = z.object({
  name: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  age: z.number().int().min(13).max(100).optional(),
  dob: z.string().optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(25).max(350).optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  experience: z.string().optional(),
  dietType: z.string().optional(),
  injuries: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  daysPerWeek: z.number().min(1).max(7).optional(),
  language: z.enum(['english', 'hindi', 'hinglish']).optional(),
});

/**
 * One-time onboarding: store profile permanently, seed Coach Memory context, and generate the
 * first Living Plan. See docs/architecture/01-prd.md A1.
 */
export async function completeOnboarding(ctx: AuthContext, raw: unknown) {
  const input = OnboardingInput.parse(raw);
  const dob = input.dob ?? (input.age ? `${new Date().getUTCFullYear() - input.age}-01-01` : undefined);

  await UsersService.ensureExists(ctx.clerkUserId);
  await UsersService.updateProfile(
    ctx.clerkUserId,
    {
      gender: input.gender,
      dob,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      goal: input.goal,
      activityLevel: input.activityLevel,
      experience: input.experience,
      dietType: input.dietType,
      injuries: input.injuries,
      conditions: input.conditions,
      allergies: input.allergies,
      equipment: input.equipment,
    },
    { completeOnboarding: true, name: input.name, language: input.language },
  );

  await MemoryService.ensureMemory(ctx.clerkUserId);
  await MemoryService.updateContext(ctx.clerkUserId, {
    goal: input.goal,
    experience: input.experience,
    equipment: input.equipment,
    dietType: input.dietType,
    injuries: input.injuries,
    weeklyCommitmentDays: input.daysPerWeek,
  });

  const plan = await PlanService.generate(ctx.clerkUserId, {
    goal: input.goal,
    experience: input.experience,
    equipment: input.equipment,
    daysPerWeek: input.daysPerWeek,
  });

  await MemoryService.recordSignal({
    clerkUserId: ctx.clerkUserId,
    source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
    type: 'checkin',
    payload: { event: 'onboarding_complete' },
    occurredAt: new Date(),
  });

  return { onboarded: true, planDays: plan.days.length };
}
