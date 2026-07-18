export function clampStoryIndex(index: number, count: number): number {
  return Math.max(0, Math.min(Math.max(0, count - 1), index));
}

export function storyIndexAfterSwipe(
  current: number,
  count: number,
  deltaX: number,
  deltaY: number,
  threshold = 55,
): number {
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) return current;
  return clampStoryIndex(current + (deltaX < 0 ? 1 : -1), count);
}
