import { Target } from 'lucide-react';
import type { NextFocusStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function NextFocusCard({ card }: { card: NextFocusStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Target />}>
      <div className={styles.focusAction}><span>01</span><strong>{card.data.action}</strong></div>
      <p className={styles.focusNote}>One clear focus. No competing checklist.</p>
    </StoryCardFrame>
  );
}
