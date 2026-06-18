import { MongoClient, type Db } from 'mongodb';
import { getMemoryDb } from './memory-store';

/**
 * Serverless-safe MongoDB connection. Uses a cached global client promise so Vercel function
 * invocations reuse one pool. Created LAZILY on first getDb() call.
 *
 * If MONGODB_URI is absent, falls back to an in-memory dev store so the product runs end-to-end
 * without external services (offline-first ethos). See docs/architecture/03 §2.
 */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
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
  return client.db(process.env.MONGODB_DB || 'fitcore');
}
