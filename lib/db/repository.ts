import type {
  Collection,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  UpdateFilter,
} from 'mongodb';
import { getDb } from './mongo';

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export interface OwnedDoc extends Document {
  clerkUserId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Base repository that FORCES ownership scoping (clerkUserId) into every read/write.
 *
 * MongoDB has no row-level security, so this class is the primary authorization control —
 * it replaces what Postgres RLS used to enforce. No user-owned collection should be queried
 * outside a repository that extends this. See docs/architecture/09-security.md §2.
 */
export class OwnedRepository<T extends OwnedDoc> {
  constructor(protected readonly collectionName: string) {}

  protected coll(): Promise<Collection<T>> {
    return getCollection<T>(this.collectionName);
  }

  async list(clerkUserId: string, filter: Filter<T> = {}): Promise<T[]> {
    const coll = await this.coll();
    const scoped = { ...filter, clerkUserId, isActive: { $ne: false } } as unknown as Filter<T>;
    return (await coll.find(scoped).toArray()) as T[];
  }

  async findOne(clerkUserId: string, filter: Filter<T> = {}): Promise<T | null> {
    const coll = await this.coll();
    const scoped = { ...filter, clerkUserId, isActive: { $ne: false } } as unknown as Filter<T>;
    return (await coll.findOne(scoped)) as T | null;
  }

  async create(clerkUserId: string, doc: Partial<T>): Promise<void> {
    const coll = await this.coll();
    const now = new Date();
    const full = { ...doc, clerkUserId, isActive: true, createdAt: now, updatedAt: now };
    await coll.insertOne(full as unknown as OptionalUnlessRequiredId<T>);
  }

  async update(clerkUserId: string, filter: Filter<T>, set: Partial<T>): Promise<void> {
    const coll = await this.coll();
    const scoped = { ...filter, clerkUserId } as unknown as Filter<T>;
    const update = { $set: { ...set, updatedAt: new Date() } } as unknown as UpdateFilter<T>;
    await coll.updateOne(scoped, update);
  }

  async softDelete(clerkUserId: string, filter: Filter<T> = {}): Promise<void> {
    const coll = await this.coll();
    const scoped = { ...filter, clerkUserId } as unknown as Filter<T>;
    const update = {
      $set: { isActive: false, deletedAt: new Date(), updatedAt: new Date() },
    } as unknown as UpdateFilter<T>;
    await coll.updateOne(scoped, update);
  }
}
