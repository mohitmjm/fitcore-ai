import type { AIProvider, AIGenerateOptions, ProviderName } from './types';
import { DEFAULT_SYSTEM, fetchWithTimeout } from './types';

interface OpenAIResponse {
  choices?: { message?: { content?: string } }[];
}

/**
 * OpenAI adapter (Chat Completions).
 * Activates when OPENAI_API_KEY is present. Model via OPENAI_MODEL (default gpt-4o-mini).
 * Supports native JSON mode via response_format.
 */
export class OpenAIProvider implements AIProvider {
  readonly name: ProviderName = 'openai';

  get available(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generate(prompt: string, opts?: AIGenerateOptions): Promise<string> {
    const key = process.env.OPENAI_API_KEY || '';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!key) throw new Error('OPENAI_API_KEY missing');

    const userContent = opts?.images?.length
      ? [
          { type: 'text', text: prompt },
          ...opts.images.map((img) => ({
            type: 'image_url',
            image_url: { url: `data:${img.mimeType};base64,${img.dataBase64}` },
          })),
        ]
      : prompt;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: opts?.system || DEFAULT_SYSTEM },
        { role: 'user', content: userContent },
      ],
      temperature: opts?.temperature ?? 0.7,
    };
    if (opts?.json) body.response_format = { type: 'json_object' };
    if (typeof opts?.maxTokens === 'number') body.max_tokens = opts.maxTokens;

    const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as OpenAIResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenAI returned no text');
    return text;
  }
}
