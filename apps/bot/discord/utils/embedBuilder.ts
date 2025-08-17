// apps/bot/discord/utils/embedBuilder.ts
import { EmbedBuilder, type ColorResolvable } from 'discord.js';
import { embedColorFor, type RoleKey } from '../styles/embed-colors';

export interface BuildEmbedOptions {
  guildThemeKey: string;                     // e.g. 'default' | 'midnight'
  role?: RoleKey;                            // semantic role for color bar
  title: string;
  description?: string;
  footerText?: string;
  url?: string;
  timestamp?: Date | number | string | true; // true => now
}

export function buildEmbed(opts: BuildEmbedOptions) {
  const colorInt = embedColorFor(opts.guildThemeKey, opts.role ?? 'primary');
  const eb = new EmbedBuilder()
    .setColor(colorInt as ColorResolvable)
    .setTitle(opts.title);

  if (opts.description) eb.setDescription(opts.description);
  if (opts.url) eb.setURL(opts.url);
  if (opts.footerText) eb.setFooter({ text: opts.footerText });

  if (opts.timestamp) {
    const ts = opts.timestamp === true ? new Date() : new Date(opts.timestamp);
    eb.setTimestamp(ts);
  }

  return eb;
}