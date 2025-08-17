// apps/web/lib/mongo.ts
import { MongoClient, type Db } from 'mongodb';

// In dev/Hot Reload, reuse the same client to avoid socket explosions.
declare global {
  // eslint-disable-next-line no-var
  var __webMongoClient: MongoClient | undefined;
}

let client: MongoClient;

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'ams';

  if (!global.__webMongoClient) {
    global.__webMongoClient = new MongoClient(uri);
    await global.__webMongoClient.connect();
  }
  client = global.__webMongoClient;

  return client.db(dbName);
}