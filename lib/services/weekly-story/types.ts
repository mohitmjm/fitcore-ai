import type { ProviderName } from '@/lib/ai/providers/types';
import type { OwnedDoc } from '@/lib/db/repository';
import type {
  StoryNarrative,
  WeeklyStoryCard,
  WeeklyStoryFacts,
  WeeklyStoryPrivacySettings,
} from '@/lib/policy/weekly-story';

export interface WeeklyStoryShareConfiguration {
  showFirstName: boolean;
  showConsistency: boolean;
  showWorkoutCount: boolean;
  showBadge: boolean;
  showComeback: boolean;
  showLevel: boolean;
  showBrandedLine: boolean;
}

export const DEFAULT_STORY_PRIVACY: WeeklyStoryPrivacySettings = {
  includeProgressPhotos: false,
};

export const DEFAULT_SHARE_CONFIGURATION: WeeklyStoryShareConfiguration = {
  showFirstName: false,
  showConsistency: true,
  showWorkoutCount: true,
  showBadge: true,
  showComeback: true,
  showLevel: false,
  showBrandedLine: true,
};

export interface WeeklyStorySnapshotDoc extends OwnedDoc {
  snapshotId: string;
  weekStart: string;
  weekEnd: string;
  timezone: string;
  version: number;
  calculationVersion: number;
  templateVersion: number;
  generatedAt: Date;
  sourceUpdatedAt: Date;
  storyFacts: Omit<WeeklyStoryFacts, 'cards'>;
  cards: WeeklyStoryCard[];
  narrative: StoryNarrative;
  dataQuality: string[];
  privacySettings: WeeklyStoryPrivacySettings;
  generationProvider: ProviderName;
  generationMode: 'ai' | 'deterministic';
  shareConfiguration: WeeklyStoryShareConfiguration;
  viewedAt?: Date;
  sharedAt?: Date;
  downloadCount: number;
  shareCount: number;
}

export interface WeeklyStorySnapshot {
  snapshotId: string;
  weekStart: string;
  weekEnd: string;
  timezone: string;
  version: number;
  calculationVersion: number;
  templateVersion: number;
  generatedAt: string;
  sourceUpdatedAt: string;
  storyFacts: Omit<WeeklyStoryFacts, 'cards'>;
  cards: WeeklyStoryCard[];
  narrative: StoryNarrative;
  dataQuality: string[];
  privacySettings: WeeklyStoryPrivacySettings;
  generationProvider: ProviderName;
  generationMode: 'ai' | 'deterministic';
  shareConfiguration: WeeklyStoryShareConfiguration;
  viewedAt?: string;
  sharedAt?: string;
  downloadCount: number;
  shareCount: number;
}

export interface WeeklyStoryHistoryPage {
  items: WeeklyStoryHistoryItem[];
  nextCursor?: string;
}

export interface WeeklyStoryHistoryItem {
  snapshotId: string;
  weekStart: string;
  weekEnd: string;
  timezone: string;
  version: number;
  generatedAt: string;
  viewedAt?: string;
  consistencyPct: number;
  standout?: string;
  level: number;
}

export type WeeklyStoryPreview =
  | { status: 'ready'; snapshotId?: string; weekStart: string; weekEnd: string; viewed: boolean; consistencyPct?: number; standout?: string }
  | { status: 'forming'; message: string; weekStart: string; weekEnd: string };
