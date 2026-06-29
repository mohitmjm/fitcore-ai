type SupabasePrimitive = string | number | boolean | null;

interface SupabaseConfig {
  restUrl: string;
  serviceRoleKey: string;
}

export type SupabaseRow = Record<string, unknown>;

class SupabaseRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'SupabaseRequestError';
  }
}

function getSupabaseConfig(): SupabaseConfig | null {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceRoleKey) return null;

  return {
    restUrl: `${baseUrl.replace(/\/$/, '')}/rest/v1`,
    serviceRoleKey,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

function headers(config: SupabaseConfig, prefer?: string): HeadersInit {
  return {
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
    'content-type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function buildUrl(config: SupabaseConfig, table: string, params: Record<string, string>): URL {
  const url = new URL(`${config.restUrl}/${table}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function requestRows<T extends SupabaseRow>(
  table: string,
  init: RequestInit & { prefer?: string },
  params: Record<string, string>,
): Promise<T[]> {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase is not configured');
  const { prefer, headers: extraHeaders, ...fetchInit } = init;

  const res = await fetch(buildUrl(config, table, params), {
    ...fetchInit,
    headers: {
      ...headers(config, prefer),
      ...(extraHeaders ?? {}),
    },
    cache: 'no-store',
  });
  const body = await parseResponse(res);
  if (!res.ok) {
    throw new SupabaseRequestError(`Supabase request failed with ${res.status}`, res.status, body);
  }

  return Array.isArray(body) ? (body as T[]) : [];
}

export async function selectSupabaseRow<T extends SupabaseRow>(
  table: string,
  filters: Record<string, SupabasePrimitive>,
  select = '*',
): Promise<T | null> {
  const params: Record<string, string> = { select, limit: '1' };
  for (const [key, value] of Object.entries(filters)) {
    params[key] = `eq.${String(value)}`;
  }

  const rows = await requestRows<T>(table, { method: 'GET' }, params);
  return rows[0] ?? null;
}

export async function selectSupabaseRows<T extends SupabaseRow>(
  table: string,
  filters: Record<string, SupabasePrimitive> = {},
  select = '*',
  options: { limit?: number; order?: string } = {},
): Promise<T[]> {
  const params: Record<string, string> = { select };
  if (options.limit) params.limit = String(options.limit);
  if (options.order) params.order = options.order;

  for (const [key, value] of Object.entries(filters)) {
    params[key] = `eq.${String(value)}`;
  }

  return requestRows<T>(table, { method: 'GET' }, params);
}

export async function upsertSupabaseRow<T extends SupabaseRow>(
  table: string,
  row: SupabaseRow,
  onConflict: string,
  select = '*',
): Promise<T | null> {
  const rows = await requestRows<T>(
    table,
    {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify(row),
    },
    { on_conflict: onConflict, select },
  );
  return rows[0] ?? null;
}

export async function updateSupabaseRows<T extends SupabaseRow>(
  table: string,
  filters: Record<string, SupabasePrimitive>,
  patch: SupabaseRow,
  select = '*',
): Promise<T[]> {
  const params: Record<string, string> = { select };
  for (const [key, value] of Object.entries(filters)) {
    params[key] = `eq.${String(value)}`;
  }

  return requestRows<T>(
    table,
    {
      method: 'PATCH',
      prefer: 'return=representation',
      body: JSON.stringify(patch),
    },
    params,
  );
}
