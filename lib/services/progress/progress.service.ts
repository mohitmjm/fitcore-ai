import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { OwnedRepository, type OwnedDoc } from '@/lib/db/repository';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { UsersService } from '@/lib/services/users/users.service';
import { SupabaseProgressRepository } from './supabase-progress.repository';

export interface ProgressLogDoc extends OwnedDoc {
  weightKg: number;
  bodyFatPct?: number;
  chestInches?: number;
  waistInches?: number;
  armsInches?: number;
  recordedDate: string; // YYYY-MM-DD
}

export interface ProgressPhotoDoc extends OwnedDoc {
  url: string;
  takenAt: string;
}

const logsRepo = new OwnedRepository<ProgressLogDoc>('progress_logs');
const photosRepo = new OwnedRepository<ProgressPhotoDoc>('progress_photos');

export const AddLogInput = z.object({
  weightKg: z.number().positive(),
  bodyFatPct: z.number().optional(),
  chestInches: z.number().optional(),
  waistInches: z.number().optional(),
  armsInches: z.number().optional(),
  recordedDate: z.string().optional(),
});

export const ProgressService = {
  async getLogs(clerkUserId: string): Promise<ProgressLogDoc[]> {
    if (isSupabaseConfigured()) {
      const logs = await SupabaseProgressRepository.listLogs(clerkUserId);
      return logs.sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
    }

    const logs = await logsRepo.list(clerkUserId);
    return logs.sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
  },

  async getPhotos(clerkUserId: string): Promise<ProgressPhotoDoc[]> {
    if (isSupabaseConfigured()) {
      const photos = await SupabaseProgressRepository.listPhotos(clerkUserId);
      return photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    }

    const photos = await photosRepo.list(clerkUserId);
    return photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  },

  async addLog(ctx: AuthContext, raw: unknown): Promise<void> {
    const input = AddLogInput.parse(raw);
    const recordedDate = input.recordedDate ?? new Date().toISOString().slice(0, 10);

    if (isSupabaseConfigured()) {
      await UsersService.ensureExists(ctx.clerkUserId);
      await SupabaseProgressRepository.createLog(ctx.clerkUserId, { ...input, recordedDate });
    } else {
      await logsRepo.create(ctx.clerkUserId, { ...input, recordedDate });
    }

    await MemoryService.recordSignal({
      clerkUserId: ctx.clerkUserId,
      source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
      type: 'weight_logged',
      payload: { weightKg: input.weightKg },
      occurredAt: new Date(),
    });
  },

  async addPhoto(clerkUserId: string, url: string): Promise<void> {
    const takenAt = new Date().toISOString();
    // NOTE: interim — stores the image reference/data URL in Mongo. Production should upload to
    // Cloudinary/Vercel Blob and store only the resulting URL (see docs/architecture/03 §5.5).
    if (isSupabaseConfigured()) {
      await UsersService.ensureExists(clerkUserId);
      await SupabaseProgressRepository.createPhoto(clerkUserId, url, takenAt);
    } else {
      await photosRepo.create(clerkUserId, { url, takenAt });
    }
  },
};
