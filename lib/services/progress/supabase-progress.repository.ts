import { supabaseRequest } from '@/lib/db/supabase';
import type { ProgressLogDoc, ProgressPhotoDoc } from './progress.service';

const LOGS_TABLE = 'clerk_progress_logs';
const PHOTOS_TABLE = 'clerk_progress_photos';

interface SupabaseProgressLogRow {
  id: string;
  clerk_user_id: string;
  weight_kg: number | string;
  body_fat_pct: number | string | null;
  chest_inches: number | string | null;
  waist_inches: number | string | null;
  arms_inches: number | string | null;
  recorded_date: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

interface SupabaseProgressPhotoRow {
  id: string;
  clerk_user_id: string;
  url: string;
  taken_at: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

function encodeFilter(value: string): string {
  return encodeURIComponent(value);
}

function numberOrUndefined(value: number | string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDate(value: string | null): Date | undefined {
  return value ? new Date(value) : undefined;
}

function toLogDoc(row: SupabaseProgressLogRow): ProgressLogDoc {
  return {
    _id: row.id,
    clerkUserId: row.clerk_user_id,
    weightKg: Number(row.weight_kg),
    bodyFatPct: numberOrUndefined(row.body_fat_pct),
    chestInches: numberOrUndefined(row.chest_inches),
    waistInches: numberOrUndefined(row.waist_inches),
    armsInches: numberOrUndefined(row.arms_inches),
    recordedDate: row.recorded_date,
    isActive: row.is_active ?? true,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    deletedAt: toDate(row.deleted_at),
  };
}

function toPhotoDoc(row: SupabaseProgressPhotoRow): ProgressPhotoDoc {
  return {
    _id: row.id,
    clerkUserId: row.clerk_user_id,
    url: row.url,
    takenAt: row.taken_at,
    isActive: row.is_active ?? true,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    deletedAt: toDate(row.deleted_at),
  };
}

export const SupabaseProgressRepository = {
  async listLogs(clerkUserId: string): Promise<ProgressLogDoc[]> {
    const rows = await supabaseRequest<SupabaseProgressLogRow[]>(
      `${LOGS_TABLE}?select=*&clerk_user_id=eq.${encodeFilter(clerkUserId)}&is_active=eq.true`,
    );
    return (rows ?? []).map(toLogDoc);
  },

  async listPhotos(clerkUserId: string): Promise<ProgressPhotoDoc[]> {
    const rows = await supabaseRequest<SupabaseProgressPhotoRow[]>(
      `${PHOTOS_TABLE}?select=*&clerk_user_id=eq.${encodeFilter(clerkUserId)}&is_active=eq.true`,
    );
    return (rows ?? []).map(toPhotoDoc);
  },

  async createLog(
    clerkUserId: string,
    input: {
      weightKg: number;
      bodyFatPct?: number;
      chestInches?: number;
      waistInches?: number;
      armsInches?: number;
      recordedDate: string;
    },
  ): Promise<void> {
    await supabaseRequest(LOGS_TABLE, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        clerk_user_id: clerkUserId,
        weight_kg: input.weightKg,
        body_fat_pct: input.bodyFatPct ?? null,
        chest_inches: input.chestInches ?? null,
        waist_inches: input.waistInches ?? null,
        arms_inches: input.armsInches ?? null,
        recorded_date: input.recordedDate,
        is_active: true,
      }),
    });
  },

  async createPhoto(clerkUserId: string, url: string, takenAt: string): Promise<void> {
    await supabaseRequest(PHOTOS_TABLE, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        clerk_user_id: clerkUserId,
        url,
        taken_at: takenAt,
        is_active: true,
      }),
    });
  },
};
