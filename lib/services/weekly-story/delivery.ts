import type { WeeklyStorySnapshot } from './types';

export interface WeeklyStoryDeliveryTemplate {
  templateKey: 'weekly_story_ready';
  text: string;
  deepLink: string;
  imageUrl?: string;
  nextFocus: string;
}

/** Provider-neutral payload for the existing channel layer. Automatic delivery stays off. */
export function buildWeeklyStoryDeliveryTemplate(
  story: WeeklyStorySnapshot,
  appUrl: string,
  imageUrl?: string,
): WeeklyStoryDeliveryTemplate {
  return {
    templateKey: 'weekly_story_ready',
    text: `Your FitCore week is ready. ${story.storyFacts.statistics.consistencyPct}% of your chosen commitment is complete.`,
    deepLink: `${appUrl.replace(/\/$/, '')}/story?weekStart=${story.weekStart}`,
    ...(imageUrl ? { imageUrl } : {}),
    nextFocus: story.storyFacts.nextFocus.action,
  };
}

export function automaticWeeklyStoryDeliveryEnabled(): boolean {
  return process.env.WEEKLY_STORY_WHATSAPP_DELIVERY === '1';
}
