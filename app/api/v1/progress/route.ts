import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { AppError } from '@/lib/core/errors';
import { ProgressService } from '@/lib/services/progress/progress.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    const [logs, photos] = await Promise.all([
      ProgressService.getLogs(ctx.clerkUserId),
      ProgressService.getPhotos(ctx.clerkUserId),
    ]);
    return ok({ logs, photos });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const body = (await req.json()) as { kind?: string; url?: string };
    if (body.kind === 'photo') {
      if (!body.url) throw new AppError('VALIDATION', 'Missing photo data', 422);
      await ProgressService.addPhoto(ctx.clerkUserId, body.url);
    } else {
      await ProgressService.addLog(ctx, body);
    }
    return ok({ saved: true });
  } catch (e) {
    return fail(e);
  }
}
