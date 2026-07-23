import { Errors } from '@/lib/core/errors';

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

function readSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  // A public Supabase URL/key can be present before server-side persistence is enabled.
  // Treat partial configuration as unavailable so callers can use their existing fallback.
  if (!url || !serviceRoleKey) return null;

  return {
    url: url.replace(/\/+$/, ''),
    serviceRoleKey,
  };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const config = readSupabaseConfig();
  if (!config) throw Errors.config('Supabase persistence is not configured.');

  const headers = new Headers(init.headers);
  headers.set('apikey', config.serviceRoleKey);
  headers.set('authorization', `Bearer ${config.serviceRoleKey}`);
  headers.set('accept', 'application/json');
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw Errors.config(
      `Supabase request failed (${response.status}): ${detail || response.statusText}`,
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}
