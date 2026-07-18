/* eslint-disable @next/next/no-img-element */
import { Images, LockKeyhole } from 'lucide-react';
import type { ProgressPhotoStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function ProgressPhotoCard({ card }: { card: ProgressPhotoStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Images />}>
      <div className={styles.photoCompare}>
        <figure><img src={card.data.beforeUrl} alt={`Progress check-in from ${card.data.beforeDate}`} /><figcaption>{card.data.beforeDate}</figcaption></figure>
        <figure><img src={card.data.currentUrl} alt={`Progress check-in from ${card.data.currentDate}`} /><figcaption>{card.data.currentDate}</figcaption></figure>
      </div>
      <span className={styles.privatePill}><LockKeyhole />Excluded from external sharing</span>
    </StoryCardFrame>
  );
}
