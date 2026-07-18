'use client';

import { ArrowRight, Dumbbell, Footprints, HeartPulse, Sparkles } from 'lucide-react';
import type { MomentumQuest } from '@/lib/policy/momentum';
import { getMomentumSpiceProfile, type MomentumSpiceLevel } from '@/lib/policy/momentum-spice';
import styles from './momentum.module.css';

const QUEST_ICONS = {
  strength: Dumbbell,
  movement: Footprints,
  recovery: HeartPulse,
} satisfies Record<MomentumQuest['kind'], typeof Dumbbell>;

interface MomentumQuestCardProps {
  quest: MomentumQuest;
  spice: MomentumSpiceLevel;
  disabled?: boolean;
  onStart: (quest: MomentumQuest) => void;
}

export function MomentumQuestCard({ quest, spice, disabled = false, onStart }: MomentumQuestCardProps) {
  const Icon = QUEST_ICONS[quest.kind];
  const spiceProfile = getMomentumSpiceProfile(spice);
  return (
    <article className={`${styles.questCard} ${styles[`accent-${quest.accent}`]} ${quest.recommended ? styles.recommended : ''}`}>
      <div className={styles.questCardTop}>
        <span className={styles.questIcon}><Icon aria-hidden="true" /></span>
        <span className={styles.questKind}>{quest.kind}</span>
        {quest.recommended ? <span className={styles.recommendedPill}><Sparkles aria-hidden="true" />Best fit</span> : null}
      </div>
      <div className={styles.questCopy}>
        <h2>{quest.title}</h2>
        <p>{quest.description}</p>
        <strong className={styles.questTease}>{spiceProfile.questLines[quest.kind]}</strong>
      </div>
      <div className={styles.questMeta}>
        <span><strong>{quest.durationMinutes}</strong> min</span>
        <span><strong>+{quest.xpReward}</strong> XP</span>
      </div>
      {quest.recommendationReason ? <p className={styles.recommendationReason}>{quest.recommendationReason}</p> : null}
      <button type="button" onClick={() => onStart(quest)} disabled={disabled} aria-label={`Start ${quest.title}, ${quest.durationMinutes} minutes`}>
        Start quest <ArrowRight aria-hidden="true" />
      </button>
    </article>
  );
}
