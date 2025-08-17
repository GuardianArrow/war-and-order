// apps/bot/discord/data/guildThemeDao.ts
import { getDb } from '../lib/mongo';
import type { GuildThemeConfig } from '../types/guildTheme';

const COLL = 'guild_theme_configs';
// Back-compat with older env names
const CACHE_TTL =
  Number(process.env.GUILD_THEME_CACHE_TTL_MS ?? process.env.THEME_CACHE_TTL_MS ?? 300_000); // 5m

type CacheEntry = { value: GuildThemeConfig; expires: number };
const cache = new Map<string, CacheEntry>();

const nowISO = () => new Date().toISOString();

async function collection() {
  const db = await getDb();
  const c = db.collection<GuildThemeConfig>(COLL);
  // Safe to call repeatedly
  await c.createIndex({ guildId: 1 }, { unique: true });
  return c;
}

function defaultDoc(guildId: string): GuildThemeConfig {
  return {
    guildId,
    themeKey: 'default',
    overrides: {},
    updatedAt: nowISO(),
    updatedBy: 'system',
  };
}

async function fetchAndCache(guildId: string): Promise<GuildThemeConfig> {
  const c = await collection();
  const doc = await c.findOne({ guildId });
  const value = doc ?? defaultDoc(guildId);
  cache.set(guildId, { value, expires: Date.now() + CACHE_TTL });
  return value;
}

/**
 * Get the guild's theme config (cached). If none exists, returns a default doc.
 */
export async function getGuildThemeConfig(guildId: string): Promise<GuildThemeConfig> {
  const hit = cache.get(guildId);
  if (hit && hit.expires > Date.now()) return hit.value;
  return fetchAndCache(guildId);
}

/**
 * Upsert the named theme key for a guild, then return the current document.
 * Returns a concrete GuildThemeConfig (never null).
 */
export async function setThemeKey(
  guildId: string,
  themeKey: string,
  actorId = 'system'
): Promise<GuildThemeConfig> {
  const c = await collection();
  await c.updateOne(
    { guildId },
    { $set: { guildId, themeKey, updatedAt: nowISO(), updatedBy: actorId } },
    { upsert: true }
  );
  cache.delete(guildId);
  return fetchAndCache(guildId);
}

/**
 * Upsert a single CSS-var override, e.g. "--role-primary-500" => "#123456",
 * then return the current document.
 */
export async function setOverride(
  guildId: string,
  name: string,
  value: string,
  actorId = 'system'
): Promise<GuildThemeConfig> {
  const c = await collection();
  await c.updateOne(
    { guildId },
    { $set: { [`overrides.${name}`]: value, updatedAt: nowISO(), updatedBy: actorId } },
    { upsert: true }
  );
  cache.delete(guildId);
  return fetchAndCache(guildId);
}

/**
 * Clear a single override, then return the current document.
 */
export async function clearOverride(
  guildId: string,
  name: string,
  actorId = 'system'
): Promise<GuildThemeConfig> {
  const c = await collection();
  await c.updateOne(
    { guildId },
    { $unset: { [`overrides.${name}`]: '' }, $set: { updatedAt: nowISO(), updatedBy: actorId } }
  );
  cache.delete(guildId);
  return fetchAndCache(guildId);
}

/** Invalidate cache for one guild or all */
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
