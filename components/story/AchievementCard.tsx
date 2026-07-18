import { Award } from 'lucide-react';
import type { AchievementStoryCard } from '@/lib/policy/weekly-story';
import { StoryCardFrame } from './StoryCardFrame';
import styles from './story.module.css';

export function AchievementCard({ card }: { card: AchievementStoryCard }) {
  return (
    <StoryCardFrame accent={card.accent} kicker={card.kicker} title={card.title} body={card.body} icon={<Award />}>
      <div className={styles.levelVisual}><span><strong>{card.data.level}</strong><small>LEVEL</small></span><div><i style={{ width: `${card.data.progressPct}%` }} /><small>{card.data.progressPct}% to the next level</small></div></div>
      <div className={styles.achievementFacts}><div><strong>{card.data.xpEarned}</strong><span>XP this week</span></div><div><strong>{card.data.totalXp}</strong><span>total XP</span></div></div>
      {card.data.badgesUnlocked[0] ? <div className={styles.badgeCallout}><Award /><span><small>Badge unlocked</small><strong>{card.data.badgesUnlocked[0].label}</strong></span></div> : card.data.nextBadge ? <div className={styles.badgeCallout}><Award /><span><small>Next realistic badge</small><strong>{card.data.nextBadge.label} · {card.data.nextBadge.progress}/{card.data.nextBadge.target}</strong></span></div> : null}
    </StoryCardFrame>
  );
}
