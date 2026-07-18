import { generate } from './registry';
import type { AIGenerateOptions } from './providers/types';

/**
 * Logical AI tasks. Each can be independently routed to a provider via an
 * `AI_PROVIDER_<TASK>` env var (e.g. AI_PROVIDER_PLAN_JSON=openai); otherwise the global
 * default order applies. See lib/ai/registry.ts.
 */
export type AITask =
  | 'nudge'
  | 'coach_chat'
  | 'weekly_story'
  | 'weekly_story_narrative'
  | 'meal_vision'
  | 'plan_json'
  | 'insight';

/**
 * Task-based AI entrypoint used across the service layer. Delegates to the provider registry,
 * which picks a live provider (Gemini/OpenAI/Claude) when a key is present and falls back to a
 * deterministic mock otherwise — so the product works before and after credentials are added.
 */
export async function runAITask(
  task: AITask,
  prompt: string,
  opts?: AIGenerateOptions,
): Promise<string> {
  return generate(prompt, opts, task);
}
