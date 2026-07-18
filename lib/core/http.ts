import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';

function preventCaching(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie, Authorization');
  return response;
}

/** Success envelope: { data, meta }. See docs/architecture/04 §3.1. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data, meta: { requestId: crypto.randomUUID() } }, { status });
}

/** User-specific response that must never be stored in a shared or browser cache. */
export function privateOk<T>(data: T, status = 200): NextResponse {
  return preventCaching(ok(data, status));
}

/** Error envelope: { error: { code, message, details } } with a stable code. */
export function fail(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const response = NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
    if (error.status === 429 && error.details && typeof error.details === 'object') {
      const retryAfter = (error.details as { retryAfterSeconds?: unknown }).retryAfterSeconds;
      if (typeof retryAfter === 'number') response.headers.set('Retry-After', String(retryAfter));
    }
    return preventCaching(response);
  }
  if (error instanceof ZodError) {
    return preventCaching(NextResponse.json(
      { error: { code: 'VALIDATION', message: 'Invalid input', details: error.flatten() } },
      { status: 422 },
    ));
  }
  console.error('[unhandled error]', error);
  return preventCaching(NextResponse.json(
    { error: { code: 'INTERNAL', message: 'Something went wrong' } },
    { status: 500 },
  ));
}
