import { MongoClient, Collection } from 'mongodb';
import type { GuildThemeConfig } from '../types/guildTheme';

const COLL_NAME = 'guild_theme_configs';
const CACHE_TTL_MS = Number(process.env.THEME_CACHE_TTL_MS ?? 5 * 60 * 1000);

type CacheEntry = { value: GuildThemeConfig; expires: number };
const cache = new Map<string, CacheEntry>();

let clientPromise: Promise<MongoClient> | null = null;
async function getClient(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error('MONGODB_URI is not set');
  clientPromise = MongoClient.connect(uri, { });
  return clientPromise;
}
async function coll(): Promise<Collection<GuildThemeConfig>> {
  const dbName = process.env.MONGODB_DB || process.env.DB_NAME || 'ams';
  const client = await getClient();
  const c = client.db(dbName).collection<GuildThemeConfig>(COLL_NAME);
  // Best-effort index (safe to call repeatedly)
  await c.createIndex({ guildId: 1 }, { unique: true });
  return c;
}

export async function getGuildThemeConfig(guildId: string): Promise<GuildThemeConfig> {
  const now = Date.now();
  const hit = cache.get(guildId);
  if (hit && hit.expires > now) return hit.value;

  const c = await coll();
  const doc =
    (await c.findOne({ guildId })) ||
    ({
      guildId,
      themeKey: 'default',
      overrides: {},
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    } as GuildThemeConfig);

  cache.set(guildId, { value: doc, expires: now + CACHE_TTL_MS });
  return doc;
}

export async function setGuildThemeKey(guildId: string, themeKey: string, updatedBy?: string) {
  const c = await coll();
  const updatedAt = new Date().toISOString();
  const res = await c.updateOne(
    { guildId },
    { $set: { guildId, themeKey, updatedAt, updatedBy } },
    { upsert: true }
  );
  cache.delete(guildId);
  return res;
}

export async function setGuildThemeOverride(
  guildId: string,
  name: string,
  value: string,
  updatedBy?: string
) {
  const c = await coll();
  const updatedAt = new Date().toISOString();
  const res = await c.updateOne(
    { guildId },
    { $set: { [`overrides.${name}`]: value, updatedAt, updatedBy } },
    { upsert: true }
  );
  cache.delete(guildId);
  return res;
}

export async function clearGuildThemeOverride(guildId: string, name: string, updatedBy?: string) {
  const c = await coll();
  const updatedAt = new Date().toISOString();
  const res = await c.updateOne(
    { guildId },
    { $unset: { [`overrides.${name}`]: '' }, $set: { updatedAt, updatedBy } }
  );
  cache.delete(guildId);
  return res;
}

export function invalidateGuildThemeCache(guildId?: string) {
  if (guildId) cache.delete(guildId);
  else cache.clear();
}
