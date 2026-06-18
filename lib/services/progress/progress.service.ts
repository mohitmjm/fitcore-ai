import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { OwnedRepository, type OwnedDoc } from '@/lib/db/repository';
import { MemoryService } from '@/lib/services/memory/memory.service';

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
    const logs = await logsRepo.list(clerkUserId);
    return logs.sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
  },

  async getPhotos(clerkUserId: string): Promise<ProgressPhotoDoc[]> {
    const photos = await photosRepo.list(clerkUserId);
    return photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  },

  async addLog(ctx: AuthContext, raw: unknown): Promise<void> {
    const input = AddLogInput.parse(raw);
    const recordedDate = input.recordedDate ?? new Date().toISOString().slice(0, 10);
    await logsRepo.create(ctx.clerkUserId, { ...input, recordedDate });
    await MemoryService.recordSignal({
      clerkUserId: ctx.clerkUserId,
      source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
      type: 'weight_logged',
      payload: { weightKg: input.weightKg },
      occurredAt: new Date(),
    });
  },

  async addPhoto(clerkUserId: string, url: string): Promise<void> {
    // NOTE: interim — stores the image reference/data URL in Mongo. Production should upload to
    // Cloudinary/Vercel Blob and store only the resulting URL (see docs/architecture/03 §5.5).
    await photosRepo.create(clerkUserId, { url, takenAt: new Date().toISOString() });
  },
};
