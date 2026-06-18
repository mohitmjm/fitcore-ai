import { ok, fail } from '@/lib/core/http';
import { providerStatus, activeProviderName, selectProvider } from '@/lib/ai/registry';

export const runtime = 'nodejs';

/**
 * AI health / diagnostics.
 *   GET /api/v1/ai/health         → which providers have credentials + which is active.
 *   GET /api/v1/ai/health?ping=1  → also runs a tiny live generation against the active provider
 *                                   and reports ok/error (confirms the key is VALID, not just set).
 * No secrets are ever returned — only provider names, booleans, and the model's reply text.
 */
export async function GET(req: Request) {
  try {
    const ping = new URL(req.url).searchParams.get('ping');
    const base = { active: activeProviderName(), providers: providerStatus() };
    if (!ping) return ok(base);

    const provider = selectProvider();
    try {
      const sample = await provider.generate('Reply with exactly one word: pong');
      return ok({ ...base, ping: { ok: true, provider: provider.name, sample: sample.trim().slice(0, 120) } });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return ok({ ...base, ping: { ok: false, provider: provider.name, error: message.slice(0, 300) } });
    }
  } catch (e) {
    return fail(e);
  }
}
