// apps/bot/tests/embed-colors.test.ts
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// SUT (role/tone resolver)
import {
  embedColorFor,
  embedColorForGuild,
  colorFromToneWithTheme,
  colorFromEventStatusWithTheme,
  hexToInt,
  type RoleKey,
} from '../discord/styles/embed-colors';

// Load palette.json to compute expected HEX dynamically (no TS JSON import needed)
const palettePath = path.resolve(__dirname, '../../../configs/tokens/palette.json');
const palette: any = JSON.parse(fs.readFileSync(palettePath, 'utf-8'));

describe('embedColorFor (theme + overrides)', () => {
  it('resolves default theme primary-500', () => {
    const hex =
      palette?.themes?.default?.primary?.['500'] ??
      palette?.brand?.primary?.hex ??
      '#4F46E5';
    const expected = hexToInt(hex);
    const got = embedColorFor('default', 'primary', '500');
    expect(got).toBe(expected);
  });

  it('resolves midnight theme primary-500 when defined', () => {
    // If "midnight" isn’t defined, skip (keeps test portable)
    const midnightHex = palette?.themes?.midnight?.primary?.['500'];
    if (!midnightHex) return;

    const expected = hexToInt(midnightHex);
    const got = embedColorFor('midnight', 'primary', '500');
    expect(got).toBe(expected);
  });

  it('applies overrides before palette (role/shade)', () => {
    const overrideHex = '#123456';
    const got = embedColorFor('default', 'primary', '500', {
      '--role-primary-500': overrideHex,
    });
    expect(got).toBe(0x123456);
  });

  it('supports various roles + shades without throwing', () => {
    const roles: RoleKey[] = ['primary', 'success', 'warning', 'danger', 'neutral'];
    for (const r of roles) {
      const n = embedColorFor('default', r, '600');
      expect(n).toBeTypeOf('number');
    }
  });
});

describe('Tone & status mapping', () => {
  it('brand tone equals Live status color for a given theme', () => {
    const a = colorFromToneWithTheme('default', 'brand');
    const b = colorFromEventStatusWithTheme('default', 'Live');
    expect(a).toEqual(b);
  });

  it('override precedence also affects tone mapping (e.g., warning → role:warning-500)', () => {
    const overrideHex = '#ABCD12';
    const n = colorFromToneWithTheme('default', 'warning', {
      '--role-warning-500': overrideHex,
    });
    expect(n).toBe(parseInt(overrideHex.slice(1), 16));
  });
});

describe('embedColorForGuild (guild-aware via DAO)', () => {
  // Mock the DAO so we don’t hit Mongo
  vi.mock('../discord/data/guildThemeDao', () => {
    return {
      getGuildThemeConfig: vi.fn().mockResolvedValue({
        guildId: 'G-1',
        themeKey: 'midnight',
        overrides: { '--role-warning-500': '#ABCDEF' },
        updatedAt: new Date().toISOString(),
        updatedBy: 'test',
      }),
    };
  });

  it('uses guild config theme & overrides', async () => {
    const color = await embedColorForGuild('G-1', 'warning', '500');
    expect(color).toBe(0xABCDEF);
  });
});