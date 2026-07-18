import { z } from 'zod';
import { TimezoneSchema } from '@/lib/services/weekly-story/schemas';

export const MomentumQuerySchema = z.object({
  timezone: TimezoneSchema.default('Asia/Kolkata'),
}).strict();

export const CompleteMomentumQuestSchema = z.object({
  timezone: TimezoneSchema.default('Asia/Kolkata'),
  questId: z.string().trim().min(8).max(140),
}).strict();
