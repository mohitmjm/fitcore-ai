import type { ObjectId } from 'mongodb';

export type CoachMode = 'normal' | 'exam' | 'travel' | 'illness' | 'busy' | 'deload' | 'comeback';
export type CoachingStyle = 'hype' | 'calm' | 'data' | 'tough_love';

/**
 * The durable, compact "coach brief" — one document per user. Layers are summarized, not
 * hoarded. See docs/architecture/02-coach-memory-architecture.md §2.1.
 */
export interface CoachMemory {
  _id?: ObjectId;
  clerkUserId: string;
  schemaVersion: number;

  context?: {
    goal?: string;
    experience?: string;
    equipment?: string[];
    dietType?: string;
    injuries?: string[];
    weeklyCommitmentDays?: number;
    lifeContext?: {
      isStudent?: boolean;
      academicEvents?: { type: string; from: string; to: string }[];
    };
  };
  behavioral?: { adherenceRate28d?: number } & Record<string, unknown>;
  motivational?: {
    bestCoachingStyle?: CoachingStyle;
    currentMotivationTrend?: 'rising' | 'stable' | 'declining';
  };
  episodic?: {
    significant?: { date: string; text: string }[];
    recent?: { date: string; text: string }[];
  };
  preferences?: {
    language?: 'english' | 'hindi' | 'hinglish';
    primaryChannel?: 'app' | 'whatsapp';
  };
  derived?: {
    currentMode?: CoachMode;
    consistencyTrend?: 'up' | 'flat' | 'down';
    lapseRisk?: 'low' | 'med' | 'high';
  };

  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SignalSource = 'app' | 'whatsapp' | 'voice' | 'system' | 'trainer';
export type SignalType =
  | 'workout_logged'
  | 'workout_skipped'
  | 'meal_logged'
  | 'weight_logged'
  | 'water_logged'
  | 'sleep_logged'
  | 'habit_logged'
  | 'checkin'
  | 'message'
  | 'plan_feedback'
  | 'mode_hint'
  | 'streak_event'
  | 'quest_completed'
  | 'nudge_result';

/** Append-only raw signal stream. Compacted into CoachMemory by the reflection job. */
export interface MemorySignal {
  _id?: ObjectId;
  clerkUserId: string;
  source: SignalSource;
  type: SignalType;
  payload?: Record<string, unknown>;
  occurredAt: Date;
  processed: boolean;
  createdAt: Date;
}
