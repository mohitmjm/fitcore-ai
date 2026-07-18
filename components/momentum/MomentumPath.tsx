import { Check, Dumbbell, Footprints, HeartPulse } from 'lucide-react';
import type { MomentumExperience, MomentumQuestKind } from '@/lib/policy/momentum';
import styles from './momentum.module.css';

const KIND_ICONS = {
  strength: Dumbbell,
  movement: Footprints,
  recovery: HeartPulse,
} satisfies Record<MomentumQuestKind, typeof Dumbbell>;

interface MomentumPathProps {
  path: MomentumExperience['path'];
}

export function MomentumPath({ path }: MomentumPathProps) {
  return (
    <ol className={styles.path} aria-label="Your seven-day Momentum path">
      {path.map((day) => {
        const Icon = day.kind ? KIND_ICONS[day.kind] : null;
        const label = day.status === 'complete'
          ? `${day.date}, ${day.kind} quest complete`
          : day.status === 'today'
            ? `${day.date}, today`
            : `${day.date}, open day`;
        return (
          <li key={day.date} className={styles[`path-${day.status}`]} aria-label={label}>
            <span>{day.dayLabel}</span>
            <i>{day.status === 'complete' ? Icon ? <Icon aria-hidden="true" /> : <Check aria-hidden="true" /> : day.dayNumber}</i>
          </li>
        );
      })}
    </ol>
  );
}
