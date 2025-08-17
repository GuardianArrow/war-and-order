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
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
      borderRadius: {
        xl: 'var(--radius-xl, 1rem)',
      },
      boxShadow: {
        md: 'var(--shadow-md, 0 6px 20px rgba(0,0,0,.12))',
      },
    },
  },

  // Registers CSS vars for ALL themes
  // :root => default theme; [data-theme="<key>"] => others
  plugins: [makeThemeCssVars()],
} satisfies Config;