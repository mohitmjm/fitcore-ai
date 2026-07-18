import { Activity } from 'lucide-react';
import type { ActivityStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function ActivitySummaryCard({ card }: { card: ActivityStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Activity />}>
      <div className={styles.metricGrid}>
        {card.data.metrics.map((metric) => <div key={metric.key}><strong>{metric.value}</strong><span>{metric.label}</span>{metric.unit ? <small>{metric.unit}</small> : null}</div>)}
      </div>
    </StoryCardFrame>
  );
}
