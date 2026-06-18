import type { AIProvider, AIGenerateOptions, ProviderName } from './types';
import { DEFAULT_SYSTEM, fetchWithTimeout } from './types';

interface ClaudeResponse {
  content?: { type: string; text?: string }[];
}

/**
 * Anthropic Claude adapter (Messages API).
 * Activates when ANTHROPIC_API_KEY is present. Model via ANTHROPIC_MODEL
 * (default claude-3-5-sonnet-latest). Claude has no JSON flag, so when json is requested we
 * strengthen the system instruction to return raw JSON only.
 */
export class ClaudeProvider implements AIProvider {
  readonly name: ProviderName = 'claude';

  get available(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async generate(prompt: string, opts?: AIGenerateOptions): Promise<string> {
    const key = process.env.ANTHROPIC_API_KEY || '';
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
    if (!key) throw new Error('ANTHROPIC_API_KEY missing');

    const system =
      (opts?.system || DEFAULT_SYSTEM) +
      (opts?.json ? ' Respond with ONLY valid JSON. No prose, no markdown fences.' : '');

    const userContent = opts?.images?.length
      ? [
          { type: 'text', text: prompt },
          ...opts.images.map((img) => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mimeType, data: img.dataBase64 },
          })),
        ]
      : prompt;

    const body: Record<string, unknown> = {
      model,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.7,
      system,
      messages: [{ role: 'user', content: userContent }],
    };

    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Claude ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as ClaudeResponse;
    const text = data.content?.find((b) => b.type === 'text')?.text;
    if (!text) throw new Error('Claude returned no text');
    return text;
  }
}
