'use client';

import { Dices, Flame, MoonStar, Sparkles } from 'lucide-react';
import {
  getMomentumSpiceProfile,
  MOMENTUM_SPICE_LEVELS,
  type MomentumSpiceLevel,
} from '@/lib/policy/momentum-spice';
import styles from './momentum.module.css';

const SPICE_ICONS = {
  chill: MoonStar,
  spicy: Flame,
  feral: Sparkles,
} satisfies Record<MomentumSpiceLevel, typeof Flame>;

interface MomentumSpiceDeckProps {
  level: MomentumSpiceLevel;
  canShuffle: boolean;
  shuffling: boolean;
  onChange: (level: MomentumSpiceLevel) => void;
  onShuffle: () => void;
}

export function MomentumSpiceDeck({ level, canShuffle, shuffling, onChange, onShuffle }: MomentumSpiceDeckProps) {
  const profile = getMomentumSpiceProfile(level);

  return (
    <section className={styles.spiceDeck} aria-labelledby="momentum-spice-title">
      <div className={styles.spiceIntro}>
        <span><Flame aria-hidden="true" />New feature</span>
        <h2 id="momentum-spice-title">Choose your coach attitude.</h2>
        <p>Personality changes. Your readiness-aware plan, duration, and XP do not.</p>
      </div>

      <fieldset className={styles.spiceChoices}>
        <legend>Coach attitude</legend>
        {MOMENTUM_SPICE_LEVELS.map((option) => {
          const Icon = SPICE_ICONS[option.id];
          const selected = option.id === level;
          return (
            <button
              key={option.id}
              type="button"
              className={selected ? styles.spiceChoiceActive : ''}
              aria-pressed={selected}
              aria-label={`${option.label}: ${option.tagline}`}
              onClick={() => onChange(option.id)}
            >
              <Icon aria-hidden="true" />
              <span><strong>{option.label}</strong><small>{option.tagline}</small></span>
            </button>
          );
        })}
      </fieldset>

      <div className={styles.spiceAction}>
        <p aria-live="polite"><strong>{profile.label} mode:</strong> {profile.heroLine}</p>
        <button type="button" onClick={onShuffle} disabled={!canShuffle || shuffling}>
          <Dices aria-hidden="true" />
          {canShuffle ? shuffling ? 'Shuffling…' : profile.shuffleLabel : 'Deck returns tomorrow'}
        </button>
      </div>
    </section>
  );
}
