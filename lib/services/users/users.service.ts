import type { UpdateFilter } from 'mongodb';
import { getCollection } from '@/lib/db/repository';
import {
  isSupabaseConfigured,
  selectSupabaseRow,
  updateSupabaseRows,
  upsertSupabaseRow,
  type SupabaseRow,
} from '@/lib/db/supabase';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { UserDoc } from './types';

const USERS = 'users';
const SUPABASE_USER_SELECT =
  'clerk_user_id,email,name,full_name,image_url,role,phone,profile,onboarding_completed_at,language,subscription_plan,subscription_status,subscription_renews_at,is_active,created_at,updated_at';

interface SupabaseUserRow extends SupabaseRow {
  clerk_user_id?: string | null;
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  image_url?: string | null;
  role?: string | null;
  phone?: string | null;
  profile?: unknown;
  onboarding_completed_at?: string | null;
  language?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_renews_at?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function asRole(role: unknown): UserDoc['role'] {
  return role === 'trainer' || role === 'nutritionist' || role === 'admin' ? role : 'user';
}

function asLocale(locale: unknown): UserDoc['locale'] {
  return locale === 'hindi' || locale === 'hinglish' ? locale : 'english';
}

function asPlan(plan: unknown): UserDoc['subscription']['plan'] {
  return plan === 'premium' || plan === 'pro' ? plan : 'free';
}

function asProfile(profile: unknown): NonNullable<UserDoc['profile']> {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return {};
  return profile as NonNullable<UserDoc['profile']>;
}

function asDate(value: string | null | undefined): Date {
  return value ? new Date(value) : new Date();
}

function placeholderEmail(clerkUserId: string): string {
  const safe = clerkUserId.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 80);
  return `${safe || 'user'}@fitcore.local`;
}

function toUserDoc(row: SupabaseUserRow): UserDoc {
  return {
    clerkUserId: row.clerk_user_id ?? '',
    email: row.email ?? '',
    name: row.name ?? row.full_name ?? 'Athlete',
    imageUrl: row.image_url ?? undefined,
    role: asRole(row.role),
    phone: row.phone ?? undefined,
    profile: asProfile(row.profile),
    onboardingCompletedAt: row.onboarding_completed_at ? new Date(row.onboarding_completed_at) : undefined,
    locale: asLocale(row.language),
    subscription: {
      plan: asPlan(row.subscription_plan),
      status: row.subscription_status ?? 'active',
      renewsAt: row.subscription_renews_at ? new Date(row.subscription_renews_at) : undefined,
    },
    isActive: row.is_active ?? true,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

async function getSupabaseUser(clerkUserId: string): Promise<UserDoc | null> {
  const row = await selectSupabaseRow<SupabaseUserRow>(
    USERS,
    { clerk_user_id: clerkUserId, is_active: true },
    SUPABASE_USER_SELECT,
  );
  return row ? toUserDoc(row) : null;
}

async function ensureSupabaseUser(
  clerkUserId: string,
  seed?: { email?: string; name?: string },
): Promise<void> {
  const existing = await getSupabaseUser(clerkUserId);
  if (existing) return;

  await upsertSupabaseRow(
    USERS,
    {
      clerk_user_id: clerkUserId,
      email: seed?.email ?? placeholderEmail(clerkUserId),
      name: seed?.name ?? 'Athlete',
      role: 'user',
      language: 'english',
      subscription_plan: 'free',
      subscription_status: 'active',
      is_active: true,
    },
    'clerk_user_id',
    SUPABASE_USER_SELECT,
  );
}

/**
 * Users/profile service. The Clerk webhook calls upsertFromClerk; onboarding calls
 * ensureExists + updateProfile. See docs/architecture/07-clerk-auth.md §5.
 */
export const UsersService = {
  async getByClerkId(clerkUserId: string): Promise<UserDoc | null> {
    if (isSupabaseConfigured()) return getSupabaseUser(clerkUserId);

    const coll = await getCollection<UserDoc>(USERS);
    return coll.findOne({ clerkUserId, isActive: { $ne: false } });
  },

  /** Upsert from a Clerk user.created / user.updated webhook (idempotent). */
  async upsertFromClerk(input: {
    clerkUserId: string;
    email: string;
    name: string;
    imageUrl?: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      await upsertSupabaseRow(
        USERS,
        {
          clerk_user_id: input.clerkUserId,
          email: input.email,
          name: input.name,
          full_name: input.name,
          image_url: input.imageUrl,
          role: 'user',
          language: 'english',
          subscription_plan: 'free',
          subscription_status: 'active',
          is_active: true,
        },
        'clerk_user_id',
        SUPABASE_USER_SELECT,
      );
      await MemoryService.ensureMemory(input.clerkUserId);
      return;
    }

    const coll = await getCollection<UserDoc>(USERS);
    const now = new Date();
    const update = {
      $set: { email: input.email, name: input.name, imageUrl: input.imageUrl, updatedAt: now },
      $setOnInsert: {
        clerkUserId: input.clerkUserId,
        role: 'user',
        locale: 'english',
        subscription: { plan: 'free', status: 'active' },
        isActive: true,
        createdAt: now,
      },
    } as unknown as UpdateFilter<UserDoc>;
    await coll.updateOne({ clerkUserId: input.clerkUserId }, update, { upsert: true });
    await MemoryService.ensureMemory(input.clerkUserId);
  },

  /** Ensure a user doc exists (used when the webhook hasn't fired, e.g. local dev). */
  async ensureExists(clerkUserId: string, seed?: { email?: string; name?: string }): Promise<void> {
    if (isSupabaseConfigured()) {
      await ensureSupabaseUser(clerkUserId, seed);
      return;
    }

    const coll = await getCollection<UserDoc>(USERS);
    const now = new Date();
    const update = {
      $setOnInsert: {
        clerkUserId,
        email: seed?.email ?? '',
        name: seed?.name ?? 'Athlete',
        role: 'user',
        locale: 'english',
        subscription: { plan: 'free', status: 'active' },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    } as unknown as UpdateFilter<UserDoc>;
    await coll.updateOne({ clerkUserId }, update, { upsert: true });
  },

  /** Replace the onboarding profile block (and optionally name/locale/onboarding flag). */
  async updateProfile(
    clerkUserId: string,
    profile: NonNullable<UserDoc['profile']>,
    opts?: { completeOnboarding?: boolean; name?: string; language?: UserDoc['locale'] },
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      await ensureSupabaseUser(clerkUserId);
      await updateSupabaseRows(
        USERS,
        { clerk_user_id: clerkUserId },
        {
          profile,
          ...(opts?.name ? { name: opts.name, full_name: opts.name } : {}),
          ...(opts?.language ? { language: opts.language } : {}),
          ...(opts?.completeOnboarding ? { onboarding_completed_at: new Date().toISOString() } : {}),
        },
        SUPABASE_USER_SELECT,
      );
      return;
    }

    const coll = await getCollection<UserDoc>(USERS);
    const set: Record<string, unknown> = { profile, updatedAt: new Date() };
    if (opts?.name) set.name = opts.name;
    if (opts?.language) set.locale = opts.language;
    if (opts?.completeOnboarding) set.onboardingCompletedAt = new Date();
    const update = { $set: set } as unknown as UpdateFilter<UserDoc>;
    await coll.updateOne({ clerkUserId }, update, { upsert: true });
  },

  async softDelete(clerkUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await updateSupabaseRows(USERS, { clerk_user_id: clerkUserId }, { is_active: false });
      return;
    }

    const coll = await getCollection<UserDoc>(USERS);
    const update = {
      $set: { isActive: false, updatedAt: new Date() },
    } as unknown as UpdateFilter<UserDoc>;
    await coll.updateOne({ clerkUserId }, update);
  },
};
