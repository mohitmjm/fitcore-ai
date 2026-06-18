import type { AuthContext } from '@/lib/core/context';
import type { AIImage } from '@/lib/ai/providers/types';
import { runAITask } from '@/lib/ai/router';
import { MemoryService } from '@/lib/services/memory/memory.service';

/**
 * AI meal-photo analysis. Sends the image to the active vision-capable provider (Gemini/OpenAI/
 * Claude) and returns estimated macros + a healthier swap. Logging a photo also emits a
 * `meal_logged` signal, so it counts toward consistency. Works offline via the deterministic mock.
 */
export interface MealAnalysis {
  items: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  healthierAlternative: string;
  confidence: 'low' | 'medium' | 'high';
}

// The "analyze this meal photo" marker lets the offline mock recognize this task deterministically.
const PROMPT =
  'Analyze this meal photo as a sports nutritionist. Identify the visible foods and estimate the ' +
  'TOTAL nutrition for the whole plate. Return ONLY JSON with this exact shape: ' +
  '{"items": string[], "calories": number, "protein_g": number, "carbs_g": number, ' +
  '"fat_g": number, "healthierAlternative": string, "confidence": "low" | "medium" | "high"}.';

function parseDataUrl(dataUrl: string): AIImage | null {
  const match = /^data:(.+?);base64,([\s\S]*)$/.exec(dataUrl.trim());
  if (!match) return null;
  return { mimeType: match[1], dataBase64: match[2] };
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseAnalysis(raw: string): MealAnalysis {
  let obj: Record<string, unknown> = {};
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') obj = parsed as Record<string, unknown>;
  } catch {
    /* fall back to safe defaults below */
  }

  const items = Array.isArray(obj.items) ? (obj.items as unknown[]).map((x) => String(x)).slice(0, 12) : [];
  const confidence: MealAnalysis['confidence'] =
    obj.confidence === 'high' ? 'high' : obj.confidence === 'medium' ? 'medium' : 'low';

  return {
    items: items.length ? items : ['Meal (estimated)'],
    calories: Math.round(num(obj.calories, 500)),
    protein_g: Math.round(num(obj.protein_g, 25)),
    carbs_g: Math.round(num(obj.carbs_g, 50)),
    fat_g: Math.round(num(obj.fat_g, 18)),
    healthierAlternative:
      typeof obj.healthierAlternative === 'string'
        ? obj.healthierAlternative
        : 'Add vegetables and lean protein; reduce fried or refined items.',
    confidence,
  };
}

export const NutritionVisionService = {
  async analyze(ctx: AuthContext, dataUrl: string): Promise<MealAnalysis> {
    const image = parseDataUrl(dataUrl);
    if (!image) throw new Error('Invalid image data URL');

    const raw = await runAITask('meal_vision', PROMPT, { json: true, images: [image] });
    const analysis = parseAnalysis(raw);

    await MemoryService.recordSignal({
      clerkUserId: ctx.clerkUserId,
      source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
      type: 'meal_logged',
      payload: { via: 'photo', calories: analysis.calories, items: analysis.items },
      occurredAt: new Date(),
    });

    return analysis;
  },
};
