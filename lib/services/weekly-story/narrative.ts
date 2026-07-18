import { z } from 'zod';
import { runAITask } from '@/lib/ai/router';
import { activeProviderName } from '@/lib/ai/registry';
import type { ProviderName } from '@/lib/ai/providers/types';
import type { StoryNarrative, WeeklyStoryFacts } from '@/lib/policy/weekly-story';

export const WeeklyStoryNarrativeSchema = z.object({
  coverHeadline: z.string().trim().min(1).max(80),
  weekSummary: z.string().trim().min(1).max(150),
  standoutTitle: z.string().trim().min(1).max(60),
  standoutExplanation: z.string().trim().min(1).max(160),
  coachInsight: z.string().trim().min(1).max(150),
  nextFocusTitle: z.string().trim().min(1).max(60),
  nextFocusExplanation: z.string().trim().min(1).max(160),
  closingLine: z.string().trim().min(1).max(90),
}).strict();

const UNSAFE_OR_UNSUPPORTED = /\b(diagnos|cure|guarantee|shredded|failed|failure|lazy|ruined|fell behind|body fat)\b/i;

function numberTokens(value: unknown): Set<string> {
  const matches = JSON.stringify(value).match(/-?\d+(?:\.\d+)?/g) ?? [];
  return new Set(matches);
}

function claimsAreSupported(narrative: StoryNarrative, approvedFacts: unknown): boolean {
  const allowed = numberTokens(approvedFacts);
  return (Object.values(narrative) as string[]).every((text) => {
    if (UNSAFE_OR_UNSUPPORTED.test(text)) return false;
    const numbers: string[] = text.match(/-?\d+(?:\.\d+)?/g) ?? [];
    return numbers.every((number) => allowed.has(number));
  });
}

function approvedNarrativeFacts(facts: WeeklyStoryFacts): Record<string, unknown> {
  return {
    week: facts.week,
    statistics: facts.statistics,
    standout: facts.standout,
    comeback: facts.comeback,
    progressTrend: facts.progressTrend
      ? { kind: facts.progressTrend.kind, direction: facts.progressTrend.direction, summary: facts.progressTrend.summary }
      : undefined,
    coachInsight: facts.coachInsight,
    achievement: facts.achievement,
    nextFocus: facts.nextFocus,
    fallbackNarrative: facts.fallbackNarrative,
  };
}

export interface NarrativeResult {
  narrative: StoryNarrative;
  provider: ProviderName;
  mode: 'ai' | 'deterministic';
}

export async function enhanceWeeklyStoryNarrative(
  facts: WeeklyStoryFacts,
  generate: typeof runAITask = runAITask,
  provider: ProviderName = activeProviderName('weekly_story_narrative'),
): Promise<NarrativeResult> {
  if (provider === 'mock') {
    return { narrative: facts.fallbackNarrative, provider, mode: 'deterministic' };
  }

  const approved = approvedNarrativeFacts(facts);
  const prompt = [
    'FITCORE_WEEKLY_STORY_NARRATIVE_V1',
    'Rewrite only the eight requested text fields from these approved facts.',
    'Do not add facts, numbers, dates, diagnoses, shame, promises, or transformation claims.',
    'Keep the tone warm, specific, concise, and consistency-first. Return only strict JSON.',
    JSON.stringify(approved),
  ].join('\n');

  try {
    const raw = await generate('weekly_story_narrative', prompt, {
      json: true,
      temperature: 0.35,
      maxTokens: 450,
      system: 'You are FitCore AI. Rephrase approved weekly facts without changing or inventing claims.',
    });
    const parsed = WeeklyStoryNarrativeSchema.parse(JSON.parse(raw));
    if (!claimsAreSupported(parsed, approved)) throw new Error('Unsupported narrative claim');
    return { narrative: parsed, provider, mode: 'ai' };
  } catch {
    return { narrative: facts.fallbackNarrative, provider, mode: 'deterministic' };
  }
}
