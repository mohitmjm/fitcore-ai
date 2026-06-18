import type { AIProvider, AIGenerateOptions, ProviderName } from './types';
import { deterministicAIResponse } from './fallback';

/**
 * Offline provider. Always available; wraps the deterministic fallback so the product is
 * fully functional with zero credentials. This is the final fallback in the registry chain.
 */
export class MockProvider implements AIProvider {
  readonly name: ProviderName = 'mock';
  readonly available = true;

  async generate(prompt: string, _opts?: AIGenerateOptions): Promise<string> {
    void _opts;
    return deterministicAIResponse(prompt);
  }
}
