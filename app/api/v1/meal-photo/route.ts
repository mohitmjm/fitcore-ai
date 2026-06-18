import { z } from 'zod';
import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { NutritionVisionService } from '@/lib/services/nutrition/vision.service';

export const runtime = 'nodejs';

/** POST /api/v1/meal-photo { image: dataUrl } → estimated macros + a healthier swap. */
const Body = z.object({ image: z.string().min(32) });

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const { image } = Body.parse(await req.json());
    const data = await NutritionVisionService.analyze(ctx, image);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
