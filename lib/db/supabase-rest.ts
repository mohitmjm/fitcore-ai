import { AppError, Errors } from '@/lib/core/errors';

interface SupabaseRestConfig {
  url: string;
  serviceRoleKey: string;
}

function getConfig(): SupabaseRestConfig {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw Errors.config('Supabase service credentials are not configured');
  }

  return {
    url: url.replace(/\/+$/, ''),
    serviceRoleKey,
  };
}

export function isSupabaseServiceConfigured(): boolean {
  return !!(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, serviceRoleKey } = getConfig();
  const headers = new Headers(init.headers);
  headers.set('apikey', serviceRoleKey);
  headers.set('authorization', `Bearer ${serviceRoleKey}`);
  headers.set('accept', 'application/json');

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {
      details = await res.text();
    }
    throw new AppError('SUPABASE', 'Supabase request failed', 502, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function supabaseSelect<T>(
  table: string,
  params: Record<string, string>,
): Promise<T[]> {
  const query = new URLSearchParams(params);
  return supabaseRest<T[]>(`${table}?${query.toString()}`);
}

export async function supabaseInsert<T>(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {
  return supabaseRest<T[]>(table, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: JSON.stringify(rows),
  });
}
