// Generated: v2025.08 — AMS Tailwind tokens stub
// Usage:
// 1) Import colors/tokens in your tailwind.config.ts and spread into theme.extend
// 2) Add the CSS variables to your global CSS (see cssVariables string below)

export const tailwindTokens = {
  colors: {
    brand: {
      primary: 'hsl(var(--color-brand-primary))',
      secondary: 'hsl(var(--color-brand-secondary))',
      accent: 'hsl(var(--color-brand-accent))',
    },
    semantic: {
      info: 'hsl(var(--color-info))',
      success: 'hsl(var(--color-success))',
      warning: 'hsl(var(--color-warning))',
      danger: 'hsl(var(--color-danger))',
      critical: 'hsl(var(--color-critical))',
      neutral: 'hsl(var(--color-neutral))',
    },
    neutral: {
      50:  '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1F2937',
      900: '#0B1220',
    },
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Segoe UI', 'Roboto', 'Apple Color Emoji', 'Noto Color Emoji', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  boxShadow: {
    card: '0 2px 12px 0 hsl(var(--shadow-color, 215 20% 20%) / 0.08)',
    popover: '0 10px 25px -5px hsl(var(--shadow-color, 215 20% 20%) / 0.2)',
  },
} as const;

// Copy-paste into your global CSS (e.g., apps/web/app/globals.css)
export const cssVariables = `
  :root {
    --color-brand-primary: 243 75% 59%;
    --color-brand-secondary: 189 87% 42%;
    --color-brand-accent: 142 72% 45%;

    --color-info: 199 90% 54%;
    --color-success: 160 84% 39%;
    --color-warning: 38 92% 50%;
    --color-danger: 0 84% 63%;
    --color-critical: 0 70% 36%;
    --color-neutral: 215 20% 49%;

    --shadow-color: 215 25% 15%;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* Adjust neutrals if you use CSS vars for gray; colors above already work on dark */
      --shadow-color: 215 20% 5%;
    }
  }
`;

// Example tailwind.config.ts usage:
// import { tailwindTokens } from './configs/tokens/tailwind.tokens'
// export default {
//   content: ['apps/web/**/*.{ts,tsx,mdx}', 'packages/**/*.{ts,tsx}'],
//   theme: {
//     extend: {
//       colors: tailwindTokens.colors,
//       fontFamily: tailwindTokens.fontFamily,
//       borderRadius: tailwindTokens.borderRadius,
//       boxShadow: tailwindTokens.boxShadow,
//     },
//   },
//   plugins: [],
// } satisfies import('tailwindcss').Config;