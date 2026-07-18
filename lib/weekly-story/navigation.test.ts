import { describe, expect, it } from 'vitest';
import { clampStoryIndex, storyIndexAfterSwipe } from './navigation';

describe('weekly story navigation', () => {
  it('clamps keyboard and button navigation to the story bounds', () => {
    expect(clampStoryIndex(-1, 8)).toBe(0);
    expect(clampStoryIndex(9, 8)).toBe(7);
  });

  it('moves on a horizontal swipe and ignores short or vertical gestures', () => {
    expect(storyIndexAfterSwipe(2, 8, -80, 10)).toBe(3);
    expect(storyIndexAfterSwipe(2, 8, 80, 10)).toBe(1);
    expect(storyIndexAfterSwipe(2, 8, -30, 4)).toBe(2);
    expect(storyIndexAfterSwipe(2, 8, -80, 100)).toBe(2);
  });
});
