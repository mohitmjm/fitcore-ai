import { RotateCcw } from 'lucide-react';
import type { ComebackStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function ComebackCard({ card }: { card: ComebackStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<RotateCcw />}>
      <div className={styles.comebackVisual}><strong>{card.data.quietDays}</strong><span>quiet days</span><i /><em>RETURN</em></div>
      <p className={styles.dateLabel}>Back on {new Date(`${card.data.returnDate}T00:00:00`).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</p>
    </StoryCardFrame>
  );
}
