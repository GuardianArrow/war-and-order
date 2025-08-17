// apps/bot/discord/commands/theme.ts
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
  PermissionFlagsBits,
} from 'discord.js';
import palette from '../../../../configs/tokens/palette.json';
import {
  getGuildThemeConfig,
  setThemeKey,
  setOverride,
  clearOverride,
} from '../data/guildThemeDao';

// Known theme keys from palette.json (first 25 to satisfy Discord choice limits)
const THEME_KEYS: string[] = Object.keys((palette as any).themes ?? { default: {} });
const THEME_CHOICES = (THEME_KEYS.length ? THEME_KEYS : ['default']).slice(0, 25);

// Helpers
const VAR_NAME_RE = /^--role-(primary|success|warning|danger|neutral)-\d{2,3}$/i;
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(v: string): `#${string}` {
  const s = v.trim();
  return (s.startsWith('#') ? s : (`#${s}`)) as `#${string}`;
}

export const data = new SlashCommandBuilder()
  .setName('theme')
  .setDescription('Manage the guild theme')
  .addSubcommand((sc) =>
    sc
      .setName('show')
      .setDescription('Show current theme and overrides'),
  )
  .addSubcommand((sc) =>
    sc
      .setName('set')
      .setDescription('Set the named theme for this guild')
      .addStringOption((o) => {
        const opt = o
          .setName('key')
          .setDescription('Theme key (e.g., default, midnight)')
          .setRequired(true);
        // Add choices if we know them
        THEME_CHOICES.forEach((k) => opt.addChoices({ name: k, value: k }));
        return opt;
      }),
  )
  .addSubcommand((sc) =>
    sc
      .setName('override')
      .setDescription('Set or update a specific token override')
      .addStringOption((o) =>
        o
          .setName('name')
          .setDescription('CSS var name, e.g., --role-primary-500')
          .setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName('value')
          .setDescription('Hex color like #RRGGBB or RRGGBB')
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName('clear')
      .setDescription('Clear a specific token override')
      .addStringOption((o) =>
        o
          .setName('name')
          .setDescription('CSS var name to clear, e.g., --role-primary-500')
          .setRequired(true),
      ),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .toJSON();

export async function execute(interaction: ChatInputCommandInteraction<CacheType>) {
  if (!interaction.inGuild()) {
    return interaction.reply({ ephemeral: true, content: 'Guild-only command.' });
  }

  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();

  try {
    if (sub === 'show') {
      const cfg = await getGuildThemeConfig(guildId);
      const themeKey = cfg?.themeKey ?? 'default';
      const entries = Object.entries(cfg?.overrides ?? {});
      const list = entries.length
        ? entries
            .slice(0, 50)
            .map(([k, v]) => `• \`${k}\` → \`${v}\``)
            .join('\n')
        : '_none_';
      return interaction.reply({
        ephemeral: true,
        content: `**Theme:** \`${themeKey}\`\n**Overrides (${entries.length}):**\n${list}`,
      });
    }

    if (sub === 'set') {
      const key = interaction.options.getString('key', true);
      // If we have a known set of keys, validate against them (but allow unknowns if you prefer)
      if (THEME_KEYS.length && !THEME_KEYS.includes(key)) {
        return interaction.reply({
          ephemeral: true,
          content: `Unknown theme key \`${key}\`.\nAvailable: ${THEME_CHOICES.map((k) => `\`${k}\``).join(', ')}`,
        });
      }
      const doc = await setThemeKey(guildId, key, interaction.user.id);
      return interaction.reply({ ephemeral: true, content: `Theme set to \`${doc.themeKey}\`.` });
    }

    if (sub === 'override') {
      const name = interaction.options.getString('name', true);
      const value = interaction.options.getString('value', true);

      if (!VAR_NAME_RE.test(name)) {
        return interaction.reply({
          ephemeral: true,
          content: 'Override name must look like `--role-primary-500` / `--role-success-600`.',
        });
      }
      if (!HEX_RE.test(value)) {
        return interaction.reply({
          ephemeral: true,
          content: 'Value must be a hex color like `#123ABC` (or `123ABC`).',
        });
      }

      const hex = normalizeHex(value);
      await setOverride(guildId, name, hex, interaction.user.id);
      return interaction.reply({
        ephemeral: true,
        content: `Override saved: \`${name}\` → \`${hex}\``,
      });
    }

    if (sub === 'clear') {
      const name = interaction.options.getString('name', true);
      if (!VAR_NAME_RE.test(name)) {
        return interaction.reply({
          ephemeral: true,
          content: 'Name must look like `--role-primary-500` / `--role-success-600`.',
        });
      }
      await clearOverride(guildId, name, interaction.user.id);
      return interaction.reply({ ephemeral: true, content: `Override cleared: \`${name}\`.` });
    }

    // Fallback
    return interaction.reply({ ephemeral: true, content: 'Unknown subcommand.' });
  } catch (err: any) {
    return interaction.reply({
      ephemeral: true,
      content: `Error: ${err?.message ?? String(err)}`,
    });
  }
}
