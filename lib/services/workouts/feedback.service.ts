import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { adaptDifficulty } from '@/lib/policy/adaptive-difficulty';
import { MemoryService } from '@/lib/services/memory/memory.service';

export const WorkoutFeedbackInput = z.object({
  feedback: z.enum(['too_easy', 'appropriate', 'challenging', 'too_difficult', 'pain']),
  workoutDate: z.string().optional(),
  exerciseName: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});

export const WorkoutFeedbackService = {
  async save(ctx: AuthContext, raw: unknown) {
    const input = WorkoutFeedbackInput.parse(raw);
    const adjustment = adaptDifficulty(input.feedback);
    await MemoryService.recordSignal({
      clerkUserId: ctx.clerkUserId,
      source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
      type: 'plan_feedback',
      payload: { ...input, adjustment },
      occurredAt: new Date(),
    });
    return adjustment;
  },
};
