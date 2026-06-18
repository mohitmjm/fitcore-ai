import type { AIProvider, AIGenerateOptions, ProviderName } from './types';
import { fetchWithTimeout } from './types';

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Google Gemini adapter (generativelanguage v1beta).
 * Activates when GEMINI_API_KEY is present. Model via GEMINI_MODEL (default gemini-2.5-flash).
 */
export class GeminiProvider implements AIProvider {
  readonly name: ProviderName = 'gemini';

  get available(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async generate(prompt: string, opts?: AIGenerateOptions): Promise<string> {
    const key = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (!key) throw new Error('GEMINI_API_KEY missing');

    const parts: Record<string, unknown>[] = [{ text: prompt }];
    for (const img of opts?.images ?? []) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.dataBase64 } });
    }
    const body: Record<string, unknown> = {
      contents: [{ parts }],
    };
    if (opts?.system) {
      body.systemInstruction = { parts: [{ text: opts.system }] };
    }
    const genCfg: Record<string, unknown> = {};
    if (opts?.json) genCfg.responseMimeType = 'application/json';
    if (typeof opts?.temperature === 'number') genCfg.temperature = opts.temperature;
    if (typeof opts?.maxTokens === 'number') genCfg.maxOutputTokens = opts.maxTokens;
    if (Object.keys(genCfg).length > 0) body.generationConfig = genCfg;

    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const responseParts = data.candidates?.[0]?.content?.parts ?? [];
    const text = responseParts
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? 'unknown';
      throw new Error(`Gemini returned no text (finishReason: ${reason})`);
    }
    return text;
  }
}
