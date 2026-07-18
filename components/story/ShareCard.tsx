import { Share2 } from 'lucide-react';
import type { ShareStoryCard } from '@/lib/policy/weekly-story';
import type { WeeklyStoryShareConfiguration } from '@/lib/services/weekly-story/types';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

interface ShareCardProps {
  card: ShareStoryCard;
  configuration?: WeeklyStoryShareConfiguration;
}

export function ShareCard({ card, configuration }: ShareCardProps) {
  const show = configuration ?? { showFirstName: true, showConsistency: true, showWorkoutCount: true, showBadge: true, showComeback: true, showLevel: true, showBrandedLine: true };
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Share2 />} className={styles.shareCard}>
      {show.showFirstName ? <span className={styles.shareName}>{card.data.firstName}&apos;s week</span> : <span className={styles.shareName}>A week in FitCore</span>}
      <div className={styles.shareHero}>{show.showConsistency ? <strong>{card.data.consistencyPct}<small>%</small></strong> : <strong>{card.data.activeDays}<small> days</small></strong>}<span>{show.showConsistency ? 'weekly consistency' : 'kept in motion'}</span></div>
      <div className={styles.shareSafeFacts}>
        <span>{card.data.activeDays} active {card.data.activeDays === 1 ? 'day' : 'days'}</span>
        {show.showWorkoutCount && card.data.workoutCount > 0 ? <span>{card.data.workoutCount} training {card.data.workoutCount === 1 ? 'day' : 'days'}</span> : null}
        {show.showLevel ? <span>Level {card.data.level}</span> : null}
        {show.showBadge && card.data.badge ? <span>{card.data.badge}</span> : null}
      </div>
      {show.showComeback && card.data.comeback ? <p className={styles.shareComeback}>{card.data.comeback}</p> : null}
      <span className={styles.shareDate}>{card.data.dateRange}</span>
    </StoryCardFrame>
  );
}
