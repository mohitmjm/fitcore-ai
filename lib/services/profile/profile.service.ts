import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { UsersService } from '@/lib/services/users/users.service';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { UserDoc } from '@/lib/services/users/types';

export const UpdateProfileInput = z.object({
  name: z.string().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  experience: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  dietType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  injuries: z.array(z.string()).optional(),
  daysPerWeek: z.number().min(1).max(7).optional(),
  language: z.enum(['english', 'hindi', 'hinglish']).optional(),
});

export interface PublicProfile {
  name: string;
  email: string;
  locale: string;
  profile: NonNullable<UserDoc['profile']>;
  daysPerWeek?: number;
}

export const ProfileService = {
  async get(clerkUserId: string): Promise<PublicProfile | null> {
    const user = await UsersService.getByClerkId(clerkUserId);
    if (!user) return null;
    const mem = await MemoryService.getMemory(clerkUserId);
    return {
      name: user.name,
      email: user.email,
      locale: user.locale,
      profile: user.profile ?? {},
      daysPerWeek: mem?.context?.weeklyCommitmentDays,
    };
  },

  async update(ctx: AuthContext, raw: unknown): Promise<void> {
    const input = UpdateProfileInput.parse(raw);
    await UsersService.ensureExists(ctx.clerkUserId);
    const existing = await UsersService.getByClerkId(ctx.clerkUserId);

    const mergedProfile: NonNullable<UserDoc['profile']> = {
      ...(existing?.profile ?? {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
      ...(input.goal !== undefined ? { goal: input.goal } : {}),
      ...(input.activityLevel !== undefined ? { activityLevel: input.activityLevel } : {}),
      ...(input.experience !== undefined ? { experience: input.experience } : {}),
      ...(input.equipment !== undefined ? { equipment: input.equipment } : {}),
      ...(input.dietType !== undefined ? { dietType: input.dietType } : {}),
      ...(input.allergies !== undefined ? { allergies: input.allergies } : {}),
      ...(input.injuries !== undefined ? { injuries: input.injuries } : {}),
    };

    await UsersService.updateProfile(ctx.clerkUserId, mergedProfile, {
      name: input.name,
      language: input.language,
    });

    const mem = await MemoryService.getMemory(ctx.clerkUserId);
    await MemoryService.updateContext(ctx.clerkUserId, {
      ...(mem?.context ?? {}),
      goal: mergedProfile.goal,
      experience: mergedProfile.experience,
      equipment: mergedProfile.equipment,
      dietType: mergedProfile.dietType,
      injuries: mergedProfile.injuries,
      weeklyCommitmentDays: input.daysPerWeek ?? mem?.context?.weeklyCommitmentDays,
    });
  },
};
