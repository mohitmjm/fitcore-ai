import { describe, expect, it } from 'vitest';
import {
  getMomentumSpiceProfile,
  isMomentumSpiceLevel,
  MOMENTUM_SPICE_LEVELS,
} from './momentum-spice';

describe('momentum spice profiles', () => {
  it('offers three distinct coach attitudes with copy for every safe quest lane', () => {
    expect(MOMENTUM_SPICE_LEVELS.map((profile) => profile.id)).toEqual(['chill', 'spicy', 'feral']);
    for (const profile of MOMENTUM_SPICE_LEVELS) {
      expect(Object.keys(profile.questLines).sort()).toEqual(['movement', 'recovery', 'strength']);
      expect(profile.heroLine.length).toBeGreaterThan(20);
    }
  });

  it('falls back safely by accepting only known persisted values', () => {
    expect(isMomentumSpiceLevel('spicy')).toBe(true);
    expect(isMomentumSpiceLevel('maximum')).toBe(false);
    expect(isMomentumSpiceLevel(null)).toBe(false);
  });

  it('keeps the energetic mode explicitly grounded in a safe plan', () => {
    const profile = getMomentumSpiceProfile('feral');
    expect(profile.tagline).toContain('Same safe plan');
    expect(profile.heroLine).toContain('tomorrow');
  });
});
