// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { roleColorPalette, makeThemeCssVars } from '../../configs/tokens/tailwind.tokens';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],

  // These classes are built via template strings on the tokens/components pages — safelist them
  safelist: [
    {
      pattern:
        /(bg|text|border|ring)-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],

  theme: {
    extend: {
      colors: {
        // Uses CSS vars: hsl(var(--role-<name>-<shade>) / <alpha-value>)
        role: roleColorPalette(),
      },
    },
  },

  // Registers CSS vars for ALL themes
  // :root => default theme; [data-theme="<key>"] => others
  plugins: [makeThemeCssVars()],
} satisfies Config;
