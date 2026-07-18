import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Errors } from '@/lib/core/errors';
import type { AuthContext } from '@/lib/core/context';
import { fail } from '@/lib/core/http';

vi.mock('@/lib/auth/context', () => ({ buildContext: vi.fn() }));

import { buildContext } from '@/lib/auth/context';
import { GET } from '@/app/api/v1/weekly-story/route';

const mockedContext = vi.mocked(buildContext);

describe('weekly story API route', () => {
  beforeEach(() => mockedContext.mockReset());

  it('returns the mobile error envelope for unauthenticated access', async () => {
    const response = fail(Errors.unauthenticated());
    const json = await response.json() as { error?: { code?: string } };
    expect(response.status).toBe(401);
    expect(json.error?.code).toBe('UNAUTHENTICATED');
  });

  it('rejects invalid dates before any story query runs', async () => {
    mockedContext.mockResolvedValue({ clerkUserId: 'api-user', role: 'user', plan: 'free', source: 'web' } satisfies AuthContext);
    const response = await GET(new Request('http://localhost/api/v1/weekly-story?weekStart=2026-02-31'));
    const json = await response.json() as { error?: { code?: string } };
    expect(response.status).toBe(422);
    expect(json.error?.code).toBe('VALIDATION');
  });
});
