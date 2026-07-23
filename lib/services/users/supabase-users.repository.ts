import { supabaseRequest } from '@/lib/db/supabase';
import type { Plan, Role } from '@/lib/core/context';
import type { UserDoc } from './types';

const TABLE = 'clerk_user_profiles';

type Locale = UserDoc['locale'];

interface SupabaseSubscription {
  plan?: Plan;
  status?: string;
  renewsAt?: string | null;
  renews_at?: string | null;
}

interface SupabaseUserProfileRow {
  clerk_user_id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  role: Role | null;
  phone: string | null;
  profile: NonNullable<UserDoc['profile']> | null;
  onboarding_completed_at: string | null;
  locale: Locale | null;
  subscription: SupabaseSubscription | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

function encodeFilter(value: string): string {
  return encodeURIComponent(value);
}

function toDate(value: string | null | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function toUserDoc(row: SupabaseUserProfileRow): UserDoc {
  const subscription = row.subscription ?? {};
  return {
    clerkUserId: row.clerk_user_id,
    email: row.email ?? '',
    name: row.name ?? 'Athlete',
    imageUrl: row.image_url ?? undefined,
    role: row.role ?? 'user',
    phone: row.phone ?? undefined,
    profile: row.profile ?? {},
    onboardingCompletedAt: toDate(row.onboarding_completed_at),
    locale: row.locale ?? 'english',
    subscription: {
      plan: subscription.plan ?? 'free',
      status: subscription.status ?? 'active',
      renewsAt: toDate(subscription.renewsAt ?? subscription.renews_at),
    },
    isActive: row.is_active ?? true,
    createdAt: toDate(row.created_at) ?? new Date(),
    updatedAt: toDate(row.updated_at) ?? new Date(),
  };
}

async function upsert(
  body: Record<string, unknown>,
  prefer = 'resolution=merge-duplicates,return=minimal',
): Promise<void> {
  await supabaseRequest(`${TABLE}?on_conflict=clerk_user_id`, {
    method: 'POST',
    headers: { Prefer: prefer },
    body: JSON.stringify(body),
  });
}

export const SupabaseUsersRepository = {
  async getByClerkId(clerkUserId: string): Promise<UserDoc | null> {
    const rows = await supabaseRequest<SupabaseUserProfileRow[]>(
      `${TABLE}?select=*&clerk_user_id=eq.${encodeFilter(clerkUserId)}&is_active=eq.true&limit=1`,
    );

    return rows?.[0] ? toUserDoc(rows[0]) : null;
  },

  async upsertFromClerk(input: {
    clerkUserId: string;
    email: string;
    name: string;
    imageUrl?: string;
  }): Promise<void> {
    await upsert({
      clerk_user_id: input.clerkUserId,
      email: input.email,
      name: input.name,
      image_url: input.imageUrl ?? null,
      is_active: true,
    });
  },

  async ensureExists(clerkUserId: string, seed?: { email?: string; name?: string }): Promise<void> {
    await upsert(
      {
        clerk_user_id: clerkUserId,
        email: seed?.email ?? '',
        name: seed?.name ?? 'Athlete',
        is_active: true,
      },
      'resolution=ignore-duplicates,return=minimal',
    );
  },

  async updateProfile(
    clerkUserId: string,
    profile: NonNullable<UserDoc['profile']>,
    opts?: { completeOnboarding?: boolean; name?: string; language?: Locale },
  ): Promise<void> {
    const patch: Record<string, unknown> = {
      clerk_user_id: clerkUserId,
      profile,
      is_active: true,
    };

    if (opts?.name) patch.name = opts.name;
    if (opts?.language) patch.locale = opts.language;
    if (opts?.completeOnboarding) patch.onboarding_completed_at = new Date().toISOString();

    await upsert(patch);
  },

  async softDelete(clerkUserId: string): Promise<void> {
    await supabaseRequest(`${TABLE}?clerk_user_id=eq.${encodeFilter(clerkUserId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    });
  },
};
