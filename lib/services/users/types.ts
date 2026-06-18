import type { ObjectId } from 'mongodb';
import type { Plan, Role } from '@/lib/core/context';

/**
 * Domain profile document. Authentication is owned by Clerk; this is keyed by `clerkUserId`
 * and synced from Clerk via webhooks. See docs/architecture/03 §5.1.
 */
export interface UserDoc {
  _id?: ObjectId;
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
