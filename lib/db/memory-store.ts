import type { Db } from 'mongodb';

/**
 * Minimal in-memory MongoDB-compatible store for LOCAL DEV ONLY.
 *
 * When MONGODB_URI is absent, getDb() returns this so the whole product runs end-to-end
 * without external services — matching the project's existing offline-first ethos. It supports
 * the subset of operations our repositories/services use: equality + $ne filters, find() with
 * sort()/limit()/toArray(), findOne, insertOne, and updateOne with $set/$setOnInsert/upsert.
 *
 * It is NOT a real database (no persistence across restarts, no transactions, no indexes).
 */
type Doc = Record<string, unknown>;

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function toComparable(value: unknown): number | string {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return String(value ?? '');
}

function matchesFilter(doc: Doc, filter: Doc): boolean {
  for (const [key, cond] of Object.entries(filter)) {
    const value = doc[key];
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      const c = cond as Record<string, unknown>;
      if ('$ne' in c) {
        if (value === c.$ne) return false;
      }
      const comparable = toComparable(value);
      if ('$gte' in c && comparable < toComparable(c.$gte)) return false;
      if ('$gt' in c && comparable <= toComparable(c.$gt)) return false;
      if ('$lte' in c && comparable > toComparable(c.$lte)) return false;
      if ('$lt' in c && comparable >= toComparable(c.$lt)) return false;
      if ('$in' in c && Array.isArray(c.$in) && !c.$in.includes(value)) return false;
      continue;
    }
    if (value !== cond) return false;
  }
  return true;
}

interface MemCursor {
  sort(spec: Record<string, 1 | -1>): MemCursor;
  limit(n: number): MemCursor;
  toArray(): Promise<Doc[]>;
}

class MemoryCollection {
  private docs: Doc[] = [];

  find(filter: Doc = {}): MemCursor {
    let result = this.docs.filter((d) => matchesFilter(d, filter));
    const cursor: MemCursor = {
      sort(spec) {
        const [key, dir] = Object.entries(spec)[0] ?? ['_id', 1];
        result = [...result].sort((a, b) => {
          const ca = toComparable(a[key]);
          const cb = toComparable(b[key]);
          if (ca < cb) return -1 * dir;
          if (ca > cb) return 1 * dir;
          return 0;
        });
        return cursor;
      },
      limit(n) {
        result = result.slice(0, n);
        return cursor;
      },
      async toArray() {
        return result.map((d) => ({ ...d }));
      },
    };
    return cursor;
  }

  async findOne(filter: Doc = {}): Promise<Doc | null> {
    const found = this.docs.find((d) => matchesFilter(d, filter));
    return found ? { ...found } : null;
  }

  async insertOne(doc: Doc): Promise<{ insertedId: string }> {
    const _id = (doc._id as string) ?? newId();
    this.docs.push({ ...doc, _id });
    return { insertedId: _id };
  }

  async updateOne(
    filter: Doc,
    update: Doc,
    options?: { upsert?: boolean },
  ): Promise<{ matchedCount: number; modifiedCount: number; upsertedCount: number }> {
    const set = (update.$set as Doc) ?? {};
    const setOnInsert = (update.$setOnInsert as Doc) ?? {};
    const increment = (update.$inc as Record<string, number>) ?? {};
    const existing = this.docs.find((d) => matchesFilter(d, filter));
    if (existing) {
      Object.assign(existing, set);
      for (const [key, delta] of Object.entries(increment)) {
        existing[key] = Number(existing[key] ?? 0) + delta;
      }
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
    }
    if (options?.upsert) {
      const base: Doc = {};
      for (const [k, v] of Object.entries(filter)) {
        if (typeof v !== 'object' || v instanceof Date) base[k] = v;
      }
      this.docs.push({ _id: newId(), ...base, ...setOnInsert, ...set });
      return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  async deleteMany(filter: Doc = {}): Promise<{ deletedCount: number }> {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => !matchesFilter(d, filter));
    return { deletedCount: before - this.docs.length };
  }
}

const globalForMem = globalThis as unknown as {
  _fitcoreMemCollections?: Map<string, MemoryCollection>;
  _fitcoreMemWarned?: boolean;
};

function collections(): Map<string, MemoryCollection> {
  if (!globalForMem._fitcoreMemCollections) {
    globalForMem._fitcoreMemCollections = new Map();
  }
  return globalForMem._fitcoreMemCollections;
}

export function getMemoryDb(): Db {
  if (!globalForMem._fitcoreMemWarned) {
    console.warn(
      '[fitcore] MONGODB_URI not set — using in-memory dev store. Data will not persist across restarts.',
    );
    globalForMem._fitcoreMemWarned = true;
  }
  const db = {
    collection(name: string) {
      const map = collections();
      if (!map.has(name)) map.set(name, new MemoryCollection());
      return map.get(name);
    },
  };
  return db as unknown as Db;
}
