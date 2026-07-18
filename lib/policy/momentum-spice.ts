import type { MomentumQuestKind } from './momentum';

export type MomentumSpiceLevel = 'chill' | 'spicy' | 'feral';

export interface MomentumSpiceProfile {
  id: MomentumSpiceLevel;
  label: string;
  tagline: string;
  heroEyebrow: string;
  heroLine: string;
  focusIntro: string;
  shuffleLabel: string;
  shuffleToast: string;
  questLines: Record<MomentumQuestKind, string>;
}

export const MOMENTUM_SPICE_LEVELS: MomentumSpiceProfile[] = [
  {
    id: 'chill',
    label: 'Chill',
    tagline: 'Kind, calm, quietly confident.',
    heroEyebrow: 'Low drama · high follow-through',
    heroLine: 'Quiet confidence. Loud consistency. Pick the win that fits today.',
    focusIntro: 'Settle in. Clean and easy.',
    shuffleLabel: 'Pick for me',
    shuffleToast: 'A calm little plot twist:',
    questLines: {
      strength: 'Strong and steady. Zero theatrics required.',
      movement: 'A walk counts. Your inbox will cope.',
      recovery: 'Recovery is training. Yes, really.',
    },
  },
  {
    id: 'spicy',
    label: 'Spicy',
    tagline: 'A sharper nudge. Still on your side.',
    heroEyebrow: 'Overthinking called · we declined',
    heroLine: 'A little attitude, one useful action, and absolutely no beige energy.',
    focusIntro: 'Okay, hot stuff. Make it tidy.',
    shuffleLabel: "Dealer's choice",
    shuffleToast: 'The deck has opinions:',
    questLines: {
      strength: 'One clean circuit. Drama not required.',
      movement: 'Touch grass, professionally.',
      recovery: 'Rest with intent. Revolutionary.',
    },
  },
  {
    id: 'feral',
    label: 'Feral-ish',
    tagline: 'Main-character energy. Same safe plan.',
    heroEyebrow: 'Big attitude · sensible load',
    heroLine: 'Cue the montage. Keep the form gorgeous. Leave some energy for tomorrow.',
    focusIntro: 'Cue the montage. Sensible chaos only.',
    shuffleLabel: 'Shuffle the chaos',
    shuffleToast: 'Chaos, but make it constructive:',
    questLines: {
      strength: 'Tiny circuit. Main-character form.',
      movement: 'Leave the scroll. Enter the montage.',
      recovery: 'Plot twist: the power move is recovery.',
    },
  },
];

const MOMENTUM_SPICE_BY_ID = Object.fromEntries(
  MOMENTUM_SPICE_LEVELS.map((profile) => [profile.id, profile]),
) as Record<MomentumSpiceLevel, MomentumSpiceProfile>;

export function isMomentumSpiceLevel(value: string | null): value is MomentumSpiceLevel {
  return value === 'chill' || value === 'spicy' || value === 'feral';
}

export function getMomentumSpiceProfile(level: MomentumSpiceLevel): MomentumSpiceProfile {
  return MOMENTUM_SPICE_BY_ID[level];
}
