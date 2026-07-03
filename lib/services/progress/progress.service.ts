import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import {
  isSupabaseServiceConfigured,
  supabaseInsert,
  supabaseSelect,
} from '@/lib/db/supabase-rest';
import { MemoryService } from '@/lib/services/memory/memory.service';

export interface ProgressLogDoc {
  _id?: string;
  clerkUserId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  weightKg: number;
  bodyFatPct?: number;
  chestInches?: number;
  waistInches?: number;
  armsInches?: number;
  recordedDate: string; // YYYY-MM-DD
}

export interface ProgressPhotoDoc {
  _id?: string;
  clerkUserId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  url: string;
  takenAt: string;
}

export const AddLogInput = z.object({
  weightKg: z.number().positive(),
  bodyFatPct: z.number().optional(),
  chestInches: z.number().optional(),
  waistInches: z.number().optional(),
  armsInches: z.number().optional(),
  recordedDate: z.string().optional(),
});

interface SupabaseProgressLogRow {
  id?: string;
  clerk_user_id: string;
  weight_kg: number | string;
  body_fat_pct?: number | string | null;
  chest_inches?: number | string | null;
  waist_inches?: number | string | null;
  arms_inches?: number | string | null;
  recorded_date: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

interface SupabaseProgressPhotoRow {
  id?: string;
  clerk_user_id: string;
  photo_url: string;
  uploaded_at: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

const memoryLogs = new Map<string, ProgressLogDoc[]>();
const memoryPhotos = new Map<string, ProgressPhotoDoc[]>();

function optionalNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapLog(row: SupabaseProgressLogRow): ProgressLogDoc {
  return {
    _id: row.id,
    clerkUserId: row.clerk_user_id,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    weightKg: Number(row.weight_kg),
    bodyFatPct: optionalNumber(row.body_fat_pct),
    chestInches: optionalNumber(row.chest_inches),
    waistInches: optionalNumber(row.waist_inches),
    armsInches: optionalNumber(row.arms_inches),
    recordedDate: row.recorded_date,
  };
}

function mapPhoto(row: SupabaseProgressPhotoRow): ProgressPhotoDoc {
  return {
    _id: row.id,
    clerkUserId: row.clerk_user_id,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    url: row.photo_url,
    takenAt: row.uploaded_at,
  };
}

export const ProgressService = {
  async getLogs(clerkUserId: string): Promise<ProgressLogDoc[]> {
    if (!isSupabaseServiceConfigured()) {
      return [...(memoryLogs.get(clerkUserId) ?? [])].sort((a, b) =>
        a.recordedDate.localeCompare(b.recordedDate),
      );
    }

    const rows = await supabaseSelect<SupabaseProgressLogRow>('progress_logs', {
      select:
        'id,clerk_user_id,weight_kg,body_fat_pct,chest_inches,waist_inches,arms_inches,recorded_date,created_at,updated_at,is_active',
      clerk_user_id: `eq.${clerkUserId}`,
      is_active: 'eq.true',
      order: 'recorded_date.asc',
    });
    return rows.map(mapLog);
  },

  async getPhotos(clerkUserId: string): Promise<ProgressPhotoDoc[]> {
    if (!isSupabaseServiceConfigured()) {
      return [...(memoryPhotos.get(clerkUserId) ?? [])].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    }

    const rows = await supabaseSelect<SupabaseProgressPhotoRow>('progress_photos', {
      select: 'id,clerk_user_id,photo_url,uploaded_at,created_at,updated_at,is_active',
      clerk_user_id: `eq.${clerkUserId}`,
      is_active: 'eq.true',
      order: 'uploaded_at.desc',
    });
    return rows.map(mapPhoto);
  },

  async addLog(ctx: AuthContext, raw: unknown): Promise<void> {
    const input = AddLogInput.parse(raw);
    const recordedDate = input.recordedDate ?? new Date().toISOString().slice(0, 10);

    if (isSupabaseServiceConfigured()) {
      await supabaseInsert<SupabaseProgressLogRow>('progress_logs', {
        clerk_user_id: ctx.clerkUserId,
        weight_kg: input.weightKg,
        body_fat_pct: input.bodyFatPct ?? null,
        chest_inches: input.chestInches ?? null,
        waist_inches: input.waistInches ?? null,
        arms_inches: input.armsInches ?? null,
        recorded_date: recordedDate,
      });
    } else {
      const rows = memoryLogs.get(ctx.clerkUserId) ?? [];
      rows.push({
        _id: crypto.randomUUID(),
        clerkUserId: ctx.clerkUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input,
        recordedDate,
      });
      memoryLogs.set(ctx.clerkUserId, rows);
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

    if (isSupabaseServiceConfigured()) {
      await supabaseInsert<SupabaseProgressPhotoRow>('progress_photos', {
        clerk_user_id: clerkUserId,
        photo_url: url,
        uploaded_at: takenAt,
      });
      return;
    }

    const rows = memoryPhotos.get(clerkUserId) ?? [];
    rows.push({
      _id: crypto.randomUUID(),
      clerkUserId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      url,
      takenAt,
    });
    memoryPhotos.set(clerkUserId, rows);
  },
};
