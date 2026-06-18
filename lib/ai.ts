import { generate } from '@/lib/ai/registry';

/**
 * Legacy AI entrypoint, retained for backward compatibility (e.g. /api/fridge-recipe).
 *
 * It now delegates to the provider registry, so it transparently uses Gemini / OpenAI / Claude
 * when a key is configured, and the deterministic offline mock when none is. New code should
 * prefer `runAITask` from '@/lib/ai/router'.
 */
export async function callAI(prompt: string, format?: 'json'): Promise<string> {
  return generate(prompt, { json: format === 'json' });
}
