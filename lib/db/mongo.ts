import { MongoClient, type Db } from 'mongodb';
import { getMemoryDb } from './memory-store';
import { ensureIndexes } from './indexes';

/**
 * Serverless-safe MongoDB connection. Uses a cached global client promise so Vercel function
 * invocations reuse one pool. Created LAZILY on first getDb() call.
 *
 * If MONGODB_URI is absent, falls back to an in-memory dev store so the product runs end-to-end
 * without external services (offline-first ethos). See docs/architecture/03 §2.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _indexInit?: boolean;
};

function getClientPromise(uri: string): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return getMemoryDb();
  }
  const client = await getClientPromise(uri);
  const db = client.db(process.env.MONGODB_DB || 'fitcore');

  // Ensure hot-path indexes exist — once per process, fire-and-forget so we never block a request.
  if (!globalForMongo._indexInit) {
    globalForMongo._indexInit = true;
    void ensureIndexes(db).catch((err) => {
      console.warn('[fitcore] ensureIndexes failed (will retry next cold start):', err);
      globalForMongo._indexInit = false;
    });
  }

  return db;
}
