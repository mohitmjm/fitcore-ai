import { BrainCircuit } from 'lucide-react';
import type { CoachInsightStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function CoachInsightCard({ card }: { card: CoachInsightStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<BrainCircuit />}>
      <div className={styles.coachSignal}><span><BrainCircuit /></span><div><strong>{card.data.supported ? 'Supported observation' : 'Honest fallback'}</strong><small>{card.data.supported ? `Based on ${card.data.evidenceCount} recorded signals` : 'No pattern is claimed without repeated evidence'}</small></div></div>
    </StoryCardFrame>
  );
}
