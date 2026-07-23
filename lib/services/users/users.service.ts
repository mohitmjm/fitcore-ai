import type { UpdateFilter } from 'mongodb';
import { isSupabaseConfigured } from '@/lib/db/supabase';
import { getCollection } from '@/lib/db/repository';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { SupabaseUsersRepository } from './supabase-users.repository';
import type { UserDoc } from './types';

const USERS = 'users';

/**
 * Users/profile service. Supabase is the primary persistence path when configured; the
 * no-credential fallback keeps local development runnable while the wider migration continues.
 */
export const UsersService = {
  async getByClerkId(clerkUserId: string): Promise<UserDoc | null> {
    if (isSupabaseConfigured()) {
      try {
        return await SupabaseUsersRepository.getByClerkId(clerkUserId);
      } catch (error) {
        // The Supabase connection may be configured before its Clerk migration is applied.
        // Keep read-only product routes available through the existing Mongo fallback.
        if (!String(error).includes('PGRST205')) throw error;
      }
    }

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
      await SupabaseUsersRepository.upsertFromClerk(input);
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
      await SupabaseUsersRepository.ensureExists(clerkUserId, seed);
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
      await SupabaseUsersRepository.updateProfile(clerkUserId, profile, opts);
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
      await SupabaseUsersRepository.softDelete(clerkUserId);
      return;
    }

    const coll = await getCollection<UserDoc>(USERS);
    const update = {
      $set: { isActive: false, updatedAt: new Date() },
    } as unknown as UpdateFilter<UserDoc>;
    await coll.updateOne({ clerkUserId }, update);
  },
};
