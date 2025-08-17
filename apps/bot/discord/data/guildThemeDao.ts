// apps/bot/discord/data/guildThemeDao.ts
import { getDb } from '../lib/mongo';
import type { GuildThemeConfig } from '../types/guildTheme';

const COLL = 'guild_theme_configs';
// Back-compat with old env name THEME_CACHE_TTL_MS
const CACHE_TTL =
  Number(process.env.GUILD_THEME_CACHE_TTL_MS ?? process.env.THEME_CACHE_TTL_MS ?? 300_000); // 5m

type CacheEntry = { value: GuildThemeConfig; expires: number };
const cache = new Map<string, CacheEntry>();

async function coll() {
  const db = await getDb();
  const c = db.collection<GuildThemeConfig>(COLL);
  // Best-effort index; safe to call repeatedly
  await c.createIndex({ guildId: 1 }, { unique: true });
  return c;
}

/**
 * Get the guild's theme config.
 * Returns a default doc (themeKey='default') if none stored yet.
 * Result is cached in-memory for CACHE_TTL.
 */
export async function getGuildThemeConfig(guildId: string): Promise<GuildThemeConfig> {
  const now = Date.now();
  const hit = cache.get(guildId);
  if (hit && hit.expires > now) return hit.value;

  const c = await coll();
  const doc = await c.findOne({ guildId });

  const value: GuildThemeConfig =
    doc ??
    ({
      guildId,
      themeKey: 'default',
      overrides: {},
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    } as GuildThemeConfig);

  cache.set(guildId, { value, expires: now + CACHE_TTL });
  return value;
}

/** Upsert the named theme key for a guild */
export async function setThemeKey(guildId: string, themeKey: string, actorId = 'system') {
  const c = await coll();
  const updatedAt = new Date().toISOString();
  const res = await c.updateOne(
    { guildId },
    { $set: { guildId, themeKey, updatedAt, updatedBy: actorId } },
    { upsert: true }
  );
  cache.delete(guildId);
  return res;
}

/** Upsert a single CSS-var override, e.g. "--role-primary-500" => "#123456" */
export async function setOverride(guildId: string, name: string, value: string, actorId = 'system') {
  const c = await coll();
  const updatedAt = new Date().toISOString();
  const res = await c.updateOne(
    { guildId },
    { $set: { [`overrides.${name}`]: value, updatedAt, updatedBy: actorId } },
    { upsert: true }
  );
  cache.delete(guildId);
  return res;
}

/** Clear a single override */
export async function clearOverride(guildId: string, name: string, actorId = 'system') {
  const c = await coll();
  const updatedAt = new Date().toISOString();
  const res = await c.updateOne(
    { guildId },
    { $unset: { [`overrides.${name}`]: '' }, $set: { updatedAt, updatedBy: actorId } }
  );
  cache.delete(guildId);
  return res;
}

/** Manually invalidate cache for a specific guild or all */
export function invalidateGuildThemeCache(guildId?: string) {
  if (guildId) cache.delete(guildId);
  else cache.clear();
}

/* -------------------
   Back-compat aliases
   ------------------- */
export const setGuildThemeKey = setThemeKey;
export const setGuildThemeOverride = setOverride;
export const clearGuildThemeOverride = clearOverride;
