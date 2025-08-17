import { MongoClient, Db } from 'mongodb';

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'wao';

let client: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  if (!URI) throw new Error('MONGODB_URI env var is required');
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}