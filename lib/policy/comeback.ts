/**
 * Comeback system (vision §5.6) — replaces punitive streaks. Pure + testable.
 * A lapse of 4+ days triggers a warm, shrunk-ask re-entry rather than a broken-streak penalty.
 */
export function shouldTriggerComeback(daysSinceLastActivity: number): {
  trigger: boolean;
  message: string;
} {
  if (daysSinceLastActivity >= 4) {
    return {
      trigger: true,
      message:
        'Welcome back \u2014 let\u2019s ease in with just 10 minutes today. Your progress is still here.',
    };
  }
  return { trigger: false, message: '' };
}
