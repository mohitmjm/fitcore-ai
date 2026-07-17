import type { ReadinessBand, ReadinessInput, ReadinessSnapshot } from '@/lib/services/readiness/types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function bandFor(score: number, input: ReadinessInput): ReadinessBand {
  if (input.sick || score <= 35) return 'recover';
  if (score <= 55) return 'reset';
  if (score <= 75) return 'steady';
  return 'push';
}

const BAND_COPY: Record<ReadinessBand, Pick<ReadinessSnapshot, 'title' | 'message'>> = {
  recover: {
    title: 'Recovery is the win today',
    message: 'Keep effort gentle. Fitcore will protect your momentum with mobility or rest instead of a hard session.',
  },
  reset: {
    title: 'Reset with a lighter session',
    message: 'Keep the habit, lower the load. A short, easy session is the smart training choice today.',
  },
  steady: {
    title: 'Ready for your planned session',
    message: 'Your signals look balanced. Train as planned and keep a comfortable effort in reserve.',
  },
  push: {
    title: 'You have room to push',
    message: 'Energy and recovery look strong. Take the full session and use great form on your hardest sets.',
  },
};

/**
 * Creates a transparent training cue from a member's self-reported signals. It is deliberately
 * not medical advice: the score only selects a sensible training intensity for today.
 */
export function calculateReadiness(date: string, input: ReadinessInput): ReadinessSnapshot {
  const energy = ((input.energy - 1) / 4) * 35;
  const sleep = (clamp(input.sleepHours, 0, 9) / 9) * 30;
  const soreness = ((5 - input.soreness) / 4) * 20;
  const stress = ((5 - input.stress) / 4) * 15;
  const timeBonus = input.timeMinutes >= 45 ? 3 : input.timeMinutes <= 15 ? -4 : 0;
  const score = clamp(Math.round(energy + sleep + soreness + stress + timeBonus), 0, 100);
  const band = bandFor(score, input);

  return { date, score, band, checkin: input, ...BAND_COPY[band] };
}
