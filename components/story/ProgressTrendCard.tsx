import { LineChart } from 'lucide-react';
import type { ProgressTrendStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function ProgressTrendCard({ card }: { card: ProgressTrendStoryCard }) {
  const [first, last] = card.data.points;
  const rising = (last?.value ?? 0) >= (first?.value ?? 0);
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<LineChart />}>
      <div className={styles.trendChart} role="img" aria-label={card.accessibilitySummary}>
        <svg viewBox="0 0 500 220" aria-hidden="true"><path d={rising ? 'M20 175 C140 170, 180 112, 260 125 S390 42, 480 54' : 'M20 54 C140 60, 180 128, 260 112 S390 178, 480 170'} /><circle cx="20" cy={rising ? 175 : 54} r="8" /><circle cx="480" cy={rising ? 54 : 170} r="8" /></svg>
        <div><span><small>{first?.label}</small><strong>{first?.value}</strong></span><span><small>{last?.label}</small><strong>{last?.value}</strong></span></div>
      </div>
      {card.data.private ? <span className={styles.privatePill}>Private in-app metric</span> : null}
    </StoryCardFrame>
  );
}
