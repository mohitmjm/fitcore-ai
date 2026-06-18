import type { AIProvider, AIGenerateOptions, ProviderName } from './providers/types';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { ClaudeProvider } from './providers/claude';
import { MockProvider } from './providers/mock';

/**
 * Provider registry + selection.
 *
 * Selection order (first match wins):
 *   1. A task-specific override env  AI_PROVIDER_<TASK>  (e.g. AI_PROVIDER_PLAN_JSON=openai)
 *   2. A global override env         AI_PROVIDER          (e.g. AI_PROVIDER=claude)
 *   3. Default preference            gemini → openai → claude
 *   4. mock (always available)
 *
 * Only providers whose credentials are present (`available`) are eligible; otherwise we skip
 * to the next. This is what makes the platform "light up" the moment a key is added — no code
 * change, just an env var + restart. See docs/architecture/04 §5.
 */

const providers: Record<ProviderName, AIProvider> = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  claude: new ClaudeProvider(),
  mock: new MockProvider(),
};

const DEFAULT_ORDER: ProviderName[] = ['gemini', 'openai', 'claude'];

function isProviderName(v: string | undefined): v is ProviderName {
  return v === 'gemini' || v === 'openai' || v === 'claude' || v === 'mock';
}

/** Resolve the provider to use for a given logical task. */
export function selectProvider(task?: string): AIProvider {
  // 1. task-specific override
  if (task) {
    const taskEnv = process.env[`AI_PROVIDER_${task.toUpperCase()}`]?.toLowerCase();
    if (isProviderName(taskEnv) && providers[taskEnv].available) return providers[taskEnv];
  }
  // 2. global override
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (isProviderName(forced) && providers[forced].available) return providers[forced];
  // 3. default preference order
  for (const name of DEFAULT_ORDER) {
    if (providers[name].available) return providers[name];
  }
  // 4. mock
  return providers.mock;
}

/**
 * Generate text using the selected provider, falling back to the mock provider on any error so
 * a request can never hard-fail due to a provider outage or a missing/expired key.
 */
export async function generate(
  prompt: string,
  opts?: AIGenerateOptions,
  task?: string,
): Promise<string> {
  const primary = selectProvider(task);
  try {
    return await primary.generate(prompt, opts);
  } catch (err) {
    if (primary.name !== 'mock') {
      console.warn(`[ai] provider "${primary.name}" failed${task ? ` for task "${task}"` : ''}; using mock fallback.`, err);
      return providers.mock.generate(prompt, opts);
    }
    throw err;
  }
}

/** Diagnostics: which providers currently have credentials. Useful for an admin/health route. */
export function providerStatus(): { name: ProviderName; available: boolean }[] {
  return (Object.keys(providers) as ProviderName[]).map((name) => ({
    name,
    available: providers[name].available,
  }));
}

/** The active provider name that WOULD be used right now (for logging / health). */
export function activeProviderName(task?: string): ProviderName {
  return selectProvider(task).name;
}
