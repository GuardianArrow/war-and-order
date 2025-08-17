// apps/bot/discord/types/guildTheme.ts

/** Arbitrary CSS-var overrides (kept small: use sparingly) */
export type TokenOverrides = Partial<Record<string, string>>;
// e.g. { '--role-primary-500': '#123456', '--font-sans': 'Inter, system-ui, ...' }

/** Canonical per-guild theming config */
export interface GuildThemeConfig {
  guildId: string;          // Discord guild snowflake
  themeKey: string;         // 'default' | 'midnight' | future keys from palette.json
  overrides?: TokenOverrides;
  updatedAt: string;        // ISO timestamp
  updatedBy?: string;       // Discord user id or 'system'
}