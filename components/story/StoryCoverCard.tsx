import { ArrowUpRight } from 'lucide-react';
import type { CoverStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function StoryCoverCard({ card }: { card: CoverStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} className={styles.coverCard}>
      <div className={styles.coverOrbit} aria-hidden="true"><span>{card.data.consistencyPct}<small>%</small></span></div>
      <div className={styles.coverMeta}>
        <span>{card.data.dateRange}</span>
        <span>Level {card.data.level} <ArrowUpRight /></span>
        <strong>{card.data.identity}</strong>
      </div>
    </StoryCardFrame>
  );
}
