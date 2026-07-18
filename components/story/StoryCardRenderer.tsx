import type { WeeklyStoryCard } from '@/lib/policy/weekly-story';
import { StoryCoverCard } from './StoryCoverCard';
import { ConsistencyCard } from './ConsistencyCard';
import { ActivitySummaryCard } from './ActivitySummaryCard';
import { StandoutCard } from './StandoutCard';
import { ComebackCard } from './ComebackCard';
import { ProgressTrendCard } from './ProgressTrendCard';
import { CoachInsightCard } from './CoachInsightCard';
import { AchievementCard } from './AchievementCard';
import { ProgressPhotoCard } from './ProgressPhotoCard';
import { NextFocusCard } from './NextFocusCard';
import { ShareCard } from './ShareCard';

export function StoryCardRenderer({ card }: { card: WeeklyStoryCard }) {
  switch (card.type) {
    case 'cover': return <StoryCoverCard card={card} />;
    case 'consistency': return <ConsistencyCard card={card} />;
    case 'activity': return <ActivitySummaryCard card={card} />;
    case 'standout': return <StandoutCard card={card} />;
    case 'comeback': return <ComebackCard card={card} />;
    case 'progress_trend': return <ProgressTrendCard card={card} />;
    case 'coach_insight': return <CoachInsightCard card={card} />;
    case 'achievement': return <AchievementCard card={card} />;
    case 'progress_photo': return <ProgressPhotoCard card={card} />;
    case 'next_focus': return <NextFocusCard card={card} />;
    case 'share': return <ShareCard card={card} />;
  }
}
