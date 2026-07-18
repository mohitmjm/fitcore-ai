import type { Plan, Role } from '@/lib/core/context';

/**
 * Domain profile record. Authentication is owned by Clerk; durable profile data is keyed by
 * `clerkUserId` in Supabase and synced from Clerk via webhooks. See docs/architecture/07.
 */
export interface UserDoc {
  clerkUserId: string;
  email: string;
  name: string;
  imageUrl?: string;
  role: Role;
  phone?: string;

  // Onboarding (stored permanently; never re-asked unless the user edits profile).
  profile?: {
    gender?: 'male' | 'female' | 'other';
    dob?: string;
    heightCm?: number;
    weightKg?: number;
    goal?: string;
    activityLevel?: string;
    experience?: string;
    dietType?: string;
    injuries?: string[];
    conditions?: string[];
    allergies?: string[];
    equipment?: string[];
  };
  onboardingCompletedAt?: Date;

  locale: 'english' | 'hindi' | 'hinglish';
  subscription: { plan: Plan; status: string; renewsAt?: Date };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
