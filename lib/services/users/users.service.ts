import type { Plan, Role } from '@/lib/core/context';
import { getSupabaseAdmin, type ClerkProfileInsert, type ClerkProfileRow, type Json } from '@/lib/supabase/server';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { UserDoc } from './types';

const TABLE = 'clerk_profiles';

type Locale = UserDoc['locale'];
type UserProfile = NonNullable<UserDoc['profile']>;

const globalForUserStore = globalThis as unknown as {
  _fitcoreDevUsers?: Map<string, UserDoc>;
};

function devUsers(): Map<string, UserDoc> {
  if (!globalForUserStore._fitcoreDevUsers) {
    globalForUserStore._fitcoreDevUsers = new Map();
  }
  return globalForUserStore._fitcoreDevUsers;
}

function defaultSubscription(): UserDoc['subscription'] {
  return { plan: 'free', status: 'active' };
}

function defaultUser(clerkUserId: string, seed?: { email?: string; name?: string }): UserDoc {
  const now = new Date();
  return {
    clerkUserId,
    email: seed?.email ?? '',
    name: seed?.name ?? 'Athlete',
    role: 'user',
    locale: 'english',
    subscription: defaultSubscription(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function asRole(value: unknown): Role {
  return value === 'trainer' || value === 'nutritionist' || value === 'admin' ? value : 'user';
}

function asPlan(value: unknown): Plan {
  return value === 'premium' || value === 'pro' ? value : 'free';
}

function asLocale(value: unknown): Locale {
  return value === 'hindi' || value === 'hinglish' ? value : 'english';
}

function asDate(value: string | null | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function asProfile(value: unknown): UserProfile {
  const raw = asRecord(value);
  const injuries = asStringArray(raw.injuries);
  const conditions = asStringArray(raw.conditions);
  const allergies = asStringArray(raw.allergies);
  const equipment = asStringArray(raw.equipment);

  return {
    ...(raw.gender === 'male' || raw.gender === 'female' || raw.gender === 'other'
      ? { gender: raw.gender }
      : {}),
    ...(typeof raw.dob === 'string' ? { dob: raw.dob } : {}),
    ...(typeof raw.heightCm === 'number' ? { heightCm: raw.heightCm } : {}),
    ...(typeof raw.weightKg === 'number' ? { weightKg: raw.weightKg } : {}),
    ...(typeof raw.goal === 'string' ? { goal: raw.goal } : {}),
    ...(typeof raw.activityLevel === 'string' ? { activityLevel: raw.activityLevel } : {}),
    ...(typeof raw.experience === 'string' ? { experience: raw.experience } : {}),
    ...(typeof raw.dietType === 'string' ? { dietType: raw.dietType } : {}),
    ...(injuries ? { injuries } : {}),
    ...(conditions ? { conditions } : {}),
    ...(allergies ? { allergies } : {}),
    ...(equipment ? { equipment } : {}),
  };
}

function asSubscription(value: unknown): UserDoc['subscription'] {
  const raw = asRecord(value);
  const renewsAt = typeof raw.renewsAt === 'string' ? new Date(raw.renewsAt) : undefined;
  return {
    plan: asPlan(raw.plan),
    status: typeof raw.status === 'string' ? raw.status : 'active',
    ...(renewsAt ? { renewsAt } : {}),
  };
}

function fromRow(row: ClerkProfileRow): UserDoc {
  return {
    clerkUserId: row.clerk_user_id,
    email: row.email ?? '',
    name: row.name ?? 'Athlete',
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    role: asRole(row.role),
    locale: asLocale(row.locale),
    profile: asProfile(row.profile),
    ...(row.onboarding_completed_at
      ? { onboardingCompletedAt: new Date(row.onboarding_completed_at) }
      : {}),
    subscription: asSubscription(row.subscription),
    isActive: row.is_active !== false,
    createdAt: asDate(row.created_at) ?? new Date(),
    updatedAt: asDate(row.updated_at) ?? new Date(),
  };
}

function toRow(user: UserDoc): ClerkProfileInsert {
  return {
    clerk_user_id: user.clerkUserId,
    email: user.email,
    name: user.name,
    image_url: user.imageUrl ?? null,
    role: user.role,
    locale: user.locale,
    profile: (user.profile ?? {}) as Json,
    subscription: {
      ...user.subscription,
      ...(user.subscription.renewsAt ? { renewsAt: user.subscription.renewsAt.toISOString() } : {}),
    } as Json,
    onboarding_completed_at: user.onboardingCompletedAt?.toISOString() ?? null,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

async function persistUser(user: UserDoc): Promise<void> {
  const supabase = getSupabaseAdmin();
  user.updatedAt = new Date();

  if (!supabase) {
    devUsers().set(user.clerkUserId, user);
    return;
  }

  const { error } = await supabase.from(TABLE).upsert(toRow(user), {
    onConflict: 'clerk_user_id',
  });
  if (error) throw new Error(`Supabase profile upsert failed: ${error.message}`);
}

/**
 * Users/profile service. The Clerk webhook calls upsertFromClerk; onboarding calls ensureExists
 * + updateProfile. Supabase is the durable store when configured; the module-level fallback keeps
 * local zero-credential development usable and intentionally does not persist.
 */
export const UsersService = {
  async getByClerkId(clerkUserId: string): Promise<UserDoc | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const user = devUsers().get(clerkUserId);
      return user?.isActive === false ? null : (user ?? null);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .neq('is_active', false)
      .maybeSingle();
    if (error) throw new Error(`Supabase profile read failed: ${error.message}`);
    return data ? fromRow(data as ClerkProfileRow) : null;
  },

  /** Upsert from a Clerk user.created / user.updated webhook (idempotent). */
  async upsertFromClerk(input: {
    clerkUserId: string;
    email: string;
    name: string;
    imageUrl?: string;
  }): Promise<void> {
    const existing = await this.getByClerkId(input.clerkUserId);
    await persistUser({
      ...(existing ?? defaultUser(input.clerkUserId, input)),
      email: input.email,
      name: input.name,
      imageUrl: input.imageUrl,
      isActive: true,
    });
    await MemoryService.ensureMemory(input.clerkUserId);
  },

  /** Ensure a user doc exists (used when the webhook hasn't fired, e.g. local dev). */
  async ensureExists(clerkUserId: string, seed?: { email?: string; name?: string }): Promise<void> {
    const existing = await this.getByClerkId(clerkUserId);
    if (!existing) await persistUser(defaultUser(clerkUserId, seed));
  },

  /** Replace the onboarding profile block (and optionally name/locale/onboarding flag). */
  async updateProfile(
    clerkUserId: string,
    profile: NonNullable<UserDoc['profile']>,
    opts?: { completeOnboarding?: boolean; name?: string; language?: UserDoc['locale'] },
  ): Promise<void> {
    const existing = (await this.getByClerkId(clerkUserId)) ?? defaultUser(clerkUserId);
    await persistUser({
      ...existing,
      profile,
      ...(opts?.name ? { name: opts.name } : {}),
      ...(opts?.language ? { locale: opts.language } : {}),
      ...(opts?.completeOnboarding ? { onboardingCompletedAt: new Date() } : {}),
      isActive: true,
    });
  },

  async softDelete(clerkUserId: string): Promise<void> {
    const existing = await this.getByClerkId(clerkUserId);
    if (!existing) return;
    await persistUser({ ...existing, isActive: false });
  },
};
