import { Star } from 'lucide-react';
import type { StandoutStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function StandoutCard({ card }: { card: StandoutStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Star />}>
      <div className={styles.standoutVisual} aria-hidden="true"><Star /><span>THIS<br />MATTERED</span></div>
    </StoryCardFrame>
  );
}
