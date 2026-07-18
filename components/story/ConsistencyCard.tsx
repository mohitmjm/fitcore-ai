import { Flame, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { ConsistencyStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function ConsistencyCard({ card }: { card: ConsistencyStoryCard }) {
  const TrendIcon = card.data.momentum === 'up' ? TrendingUp : card.data.momentum === 'down' ? TrendingDown : Minus;
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (card.data.consistencyPct / 100) * circumference;
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Flame />}>
      <div className={styles.consistencyVisual}>
        <svg viewBox="0 0 250 250" role="img" aria-label={`${card.data.consistencyPct}% weekly consistency`}>
          <circle cx="125" cy="125" r={radius} />
          <circle className={styles.ringValue} cx="125" cy="125" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span><strong>{card.data.consistencyPct}%</strong><small>commitment</small></span>
      </div>
      <div className={styles.statTriplet}>
        <div><strong>{card.data.activeDays}/{card.data.commitmentDays}</strong><span>chosen days</span></div>
        <div><strong>{card.data.currentStreak}</strong><span>current streak</span></div>
        <div><strong>{card.data.longestStreak}</strong><span>longest streak</span></div>
      </div>
      <div className={styles.momentumPill}><TrendIcon />{card.data.changePct === 0 ? 'Same rhythm as last week' : `${card.data.changePct > 0 ? '+' : ''}${card.data.changePct} points vs last week`}</div>
    </StoryCardFrame>
  );
}
