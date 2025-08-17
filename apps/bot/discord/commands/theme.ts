import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { getGuildThemeConfig, setGuildThemeKey, setGuildThemeOverride } from '../data/guildThemeDao';
import type { RoleKey } from '../styles/embed-colors';

export const data = new SlashCommandBuilder()
  .setName('theme')
  .setDescription('Manage the guild theme')
  .addSubcommand((sc) =>
    sc.setName('show').setDescription('Show current theme and overrides')
  )
  .addSubcommand((sc) =>
    sc
      .setName('set')
      .setDescription('Set the named theme for this guild')
      .addStringOption((o) =>
        o
          .setName('key')
          .setDescription('Theme key (e.g., default, midnight)')
          .setRequired(true)
          .addChoices(
            { name: 'default', value: 'default' },
            { name: 'midnight', value: 'midnight' },
          )
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName('override')
      .setDescription('Set or update a specific token override')
      .addStringOption((o) =>
        o
          .setName('name')
          .setDescription('CSS var name, e.g., --role-primary-500')
          .setRequired(true)
      )
      .addStringOption((o) =>
        o
          .setName('value')
          .setDescription('Hex color like #RRGGBB')
          .setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .toJSON();

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) {
    return interaction.reply({ content: 'Guild-only command.', ephemeral: true });
  }
  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();

  if (sub === 'show') {
    const cfg = await getGuildThemeConfig(guildId);
    const overrides = Object.entries(cfg.overrides ?? {}).slice(0, 20);
    const ovText = overrides.length
      ? overrides.map(([k, v]) => `• \`${k}\` → \`${v}\``).join('\n')
      : '_none_';
    return interaction.reply({
      ephemeral: true,
      content:
        `**Theme:** \`${cfg.themeKey}\`\n` +
        `**Overrides (${overrides.length}):**\n${ovText}`,
    });
  }

  if (sub === 'set') {
    const key = interaction.options.getString('key', true);
    await setGuildThemeKey(guildId, key, interaction.user.id);
    return interaction.reply({ ephemeral: true, content: `Theme set to \`${key}\`.` });
  }

  if (sub === 'override') {
    const name = interaction.options.getString('name', true);
    const value = interaction.options.getString('value', true);
    if (!/^--role-(primary|success|warning|danger|neutral)-\d{2,3}$/.test(name)) {
      return interaction.reply({
        ephemeral: true,
        content:
          'Override name must be like `--role-primary-500` / `--role-success-600`.',
      });
    }
    if (!/^#?[0-9a-fA-F]{6}$/.test(value)) {
      return interaction.reply({
        ephemeral: true,
        content: 'Value must be a hex color like `#123ABC`.',
      });
    }
    await setGuildThemeOverride(guildId, name, value.startsWith('#') ? value : `#${value}`, interaction.user.id);
    return interaction.reply({ ephemeral: true, content: `Override saved: \`${name}\` → \`${value}\`` });
  }
}
