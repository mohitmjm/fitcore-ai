import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';

/** Success envelope: { data, meta }. See docs/architecture/04 §3.1. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data, meta: { requestId: crypto.randomUUID() } }, { status });
}

/** Error envelope: { error: { code, message, details } } with a stable code. */
export function fail(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'Invalid input', details: error.flatten() } },
      { status: 422 },
    );
  }
  console.error('[unhandled error]', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL', message: 'Something went wrong' } },
    { status: 500 },
  );
}
