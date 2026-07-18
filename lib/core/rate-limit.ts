import { AppError } from './errors';

interface RateWindow {
  hits: number[];
}

const globalForRateLimit = globalThis as unknown as {
  _fitcoreRateLimits?: Map<string, RateWindow>;
};

function windows(): Map<string, RateWindow> {
  if (!globalForRateLimit._fitcoreRateLimits) globalForRateLimit._fitcoreRateLimits = new Map();
  return globalForRateLimit._fitcoreRateLimits;
}

/**
 * Small process-local limiter used by the zero-credential runtime. The interface is deliberately
 * provider-neutral so a distributed Redis implementation can replace it without changing routes.
 */
function enforceLocalRateLimit(key: string, limit: number, windowMs: number, now: number): void {
  const store = windows();
  const cutoff = now - windowMs;
  const entry = store.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((hit) => hit > cutoff);
  if (entry.hits.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.hits[0] + windowMs - now) / 1000));
    throw new AppError('RATE_LIMITED', 'Please wait before trying that again', 429, { retryAfterSeconds });
  }
  entry.hits.push(now);
  store.set(key, entry);
}

async function enforceUpstashRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, Math.ceil(windowMs / 1000), 'NX'],
        ['TTL', key],
      ]),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json() as { result?: unknown; error?: unknown }[];
    if (
      !Array.isArray(result) ||
      result.length < 3 ||
      result.some((entry) => !entry || typeof entry !== 'object' || 'error' in entry)
    ) {
      return false;
    }
    const count = Number(result[0].result);
    const rawTtl = Number(result[2].result);
    if (!Number.isFinite(count) || count < 1 || !Number.isFinite(rawTtl) || rawTtl < 1) {
      return false;
    }
    const ttl = Math.ceil(rawTtl);
    if (count > limit) throw new AppError('RATE_LIMITED', 'Please wait before trying that again', 429, { retryAfterSeconds: ttl });
    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<void> {
  if (await enforceUpstashRateLimit(`fitcore:${key}`, limit, windowMs)) return;
  enforceLocalRateLimit(key, limit, windowMs, now);
}

export function resetRateLimitsForTests(): void {
  if (process.env.NODE_ENV === 'test') windows().clear();
}
