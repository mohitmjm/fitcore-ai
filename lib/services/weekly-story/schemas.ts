import { z } from 'zod';
import {
  DEFAULT_SHARE_CONFIGURATION,
  DEFAULT_STORY_PRIVACY,
} from './types';

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const DateKeySchema = z.string().refine(isValidDateKey, 'Invalid date');
export const TimezoneSchema = z.string().max(80).refine(isValidTimezone, 'Invalid timezone');

export const StoryPrivacySchema = z.object({
  includeProgressPhotos: z.boolean().default(DEFAULT_STORY_PRIVACY.includeProgressPhotos),
}).strict();

export const StoryShareConfigurationSchema = z.object({
  showFirstName: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showFirstName),
  showConsistency: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showConsistency),
  showWorkoutCount: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showWorkoutCount),
  showBadge: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showBadge),
  showComeback: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showComeback),
  showLevel: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showLevel),
  showBrandedLine: z.boolean().default(DEFAULT_SHARE_CONFIGURATION.showBrandedLine),
}).strict();

export const WeeklyStoryQuerySchema = z.object({
  period: z.enum(['current', 'previous']).default('previous'),
  weekStart: DateKeySchema.optional(),
  timezone: TimezoneSchema.default('Asia/Kolkata'),
  preview: z.enum(['0', '1']).default('0'),
}).strict();

export const GenerateWeeklyStorySchema = z.object({
  period: z.enum(['current', 'previous']).default('previous'),
  weekStart: DateKeySchema.optional(),
  timezone: TimezoneSchema.default('Asia/Kolkata'),
  privacySettings: StoryPrivacySchema.default(DEFAULT_STORY_PRIVACY),
}).strict();

export const RegenerateWeeklyStorySchema = GenerateWeeklyStorySchema.extend({
  reason: z.string().trim().max(160).optional(),
}).strict();

export const StoryHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
  cursor: z.string().datetime().optional(),
}).strict();

export const StoryViewedSchema = z.object({
  snapshotId: z.string().uuid(),
}).strict();

export const StoryShareEventSchema = z.object({
  snapshotId: z.string().uuid(),
  action: z.enum(['share', 'download', 'copy']),
  configuration: StoryShareConfigurationSchema,
}).strict();

export const DeleteWeeklyStorySchema = z.object({
  snapshotId: z.string().uuid(),
}).strict();
