/**
 * AI provider abstraction. Every LLM provider (Gemini, OpenAI, Claude) implements this
 * interface, plus a deterministic Mock provider for offline/no-key operation.
 *
 * Design goal (the "works the moment a key is added" contract):
 *   - `available` reads process.env LIVE on every call (no construction-time caching), so
 *     dropping a key into .env.local + restarting the server is enough to activate a provider.
 *   - `generate` MUST throw on any failure so the registry can fall through to the next
 *     provider and ultimately the Mock — the product never hard-fails for lack of a key.
 *
 * See docs/architecture/04-service-and-api-architecture.md §5 (AI routing).
 */

export type ProviderName = 'gemini' | 'openai' | 'claude' | 'mock';

export interface AIImage {
  /** MIME type, e.g. 'image/jpeg' or 'image/png'. */
  mimeType: string;
  /** Base64-encoded image bytes WITHOUT the `data:...;base64,` prefix. */
  dataBase64: string;
}

export interface AIGenerateOptions {
  /** Ask the provider for strict JSON output (uses native JSON modes where supported). */
  json?: boolean;
  /** 0..1 sampling temperature. Defaults are provider-sensible. */
  temperature?: number;
  /** Soft cap on output tokens. */
  maxTokens?: number;
  /** Optional system / role instruction. */
  system?: string;
  /** Optional images for multimodal/vision prompts (meal photos, form checks, etc.). */
  images?: AIImage[];
}

export interface AIProvider {
  /** Stable identifier used for selection + logging. */
  readonly name: ProviderName;
  /** True when this provider has the credentials it needs RIGHT NOW (reads env live). */
  readonly available: boolean;
  /**
   * Generate a completion. MUST throw on error (never silently return '') so the registry
   * can fall through to the next provider / mock.
   */
  generate(prompt: string, opts?: AIGenerateOptions): Promise<string>;
}

export const DEFAULT_SYSTEM =
  'You are FitCore AI — a warm, concise, knowledgeable fitness and nutrition coach. ' +
  'Be practical and encouraging. When asked for JSON, return ONLY valid JSON with no markdown.';

/** Shared fetch timeout helper so a hung provider can never block a request indefinitely. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 20000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
