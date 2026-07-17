import { beforeEach, describe, expect, it } from 'vitest';
import { UsersService } from './users.service';

beforeEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('UsersService dev fallback', () => {
  it('keeps the Clerk profile contract without Supabase credentials', async () => {
    const clerkUserId = `test-user-${crypto.randomUUID()}`;

    await UsersService.ensureExists(clerkUserId, {
      email: 'athlete@example.com',
      name: 'Athlete One',
    });

    await UsersService.updateProfile(
      clerkUserId,
      {
        goal: 'muscle gain',
        equipment: ['home', 'dumbbells'],
        dietType: 'veg',
      },
      { completeOnboarding: true, name: 'Athlete Prime', language: 'hinglish' },
    );

    const user = await UsersService.getByClerkId(clerkUserId);
    expect(user?.email).toBe('athlete@example.com');
    expect(user?.name).toBe('Athlete Prime');
    expect(user?.locale).toBe('hinglish');
    expect(user?.subscription.plan).toBe('free');
    expect(user?.profile?.goal).toBe('muscle gain');
    expect(user?.profile?.equipment).toEqual(['home', 'dumbbells']);
    expect(user?.onboardingCompletedAt).toBeInstanceOf(Date);
  });

  it('hides soft-deleted profiles from reads', async () => {
    const clerkUserId = `deleted-user-${crypto.randomUUID()}`;

    await UsersService.ensureExists(clerkUserId);
    await UsersService.softDelete(clerkUserId);

    await expect(UsersService.getByClerkId(clerkUserId)).resolves.toBeNull();
  });
});
