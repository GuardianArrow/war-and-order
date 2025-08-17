// apps/web/app/api/themes/[guildId]/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';

export const runtime = 'nodejs'; // ensure Node runtime for Mongo

type TokenOverrideMap = Partial<Record<string, string>>;
export interface GuildThemeConfig {
  guildId: string;
  themeKey: string;
  overrides?: TokenOverrideMap;
  updatedAt: string;
  updatedBy?: string;
}

const COLL = 'guild_theme_configs';

async function coll() {
  const db = await getDb();
  const c = db.collection<GuildThemeConfig>(COLL);
  // Best-effort index; safe to call repeatedly
  await c.createIndex({ guildId: 1 }, { unique: true });
  return c;
}

/** GET -> current config (or default if not set) */
export async function GET(_req: Request, { params }: { params: { guildId: string } }) {
  const c = await coll();
  const guildId = params.guildId;
  const doc =
    (await c.findOne({ guildId })) ??
    ({
      guildId,
      themeKey: 'default',
      overrides: {},
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    } satisfies GuildThemeConfig);

  return NextResponse.json(doc);
}

/**
 * PATCH body:
 * {
 *   themeKey?: string,
 *   overrides?: Record<cssVar, hex>,   // set/update these
 *   clear?: string[]                   // CSS var names to delete
 * }
 */
export async function PATCH(req: Request, { params }: { params: { guildId: string } }) {
  const guildId = params.guildId;
  const body = await req.json().catch(() => ({} as any));
  const {
    themeKey,
    overrides,
    clear,
  }: { themeKey?: string; overrides?: Record<string, string>; clear?: string[] } = body || {};

  const $set: Record<string, any> = {
    updatedAt: new Date().toISOString(),
    updatedBy: 'web-admin',
  };
  if (typeof themeKey === 'string' && themeKey.length) $set.themeKey = themeKey;

  if (overrides && typeof overrides === 'object') {
    for (const [k, v] of Object.entries(overrides)) {
      $set[`overrides.${k}`] = String(v).startsWith('#') ? v : `#${v}`;
    }
  }

  const $unset: Record<string, ''> = {};
  if (Array.isArray(clear)) {
    for (const name of clear) $unset[`overrides.${name}`] = '';
  }

  const c = await coll();
  const res = await c.findOneAndUpdate(
    { guildId },
    {
      ...(Object.keys($set).length ? { $set } : {}),
      ...(Object.keys($unset).length ? { $unset } : {}),
    },
    {
      upsert: true,
      returnDocument: 'after',
      includeResultMetadata: true, // <-- makes the return type { value: ... }
    }
  );

  // Upserts should return a document, but be defensive in case of null.
  const doc = res.value ?? (await c.findOne({ guildId }))!;
  return NextResponse.json(doc);
}