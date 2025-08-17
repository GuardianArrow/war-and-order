import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { tokens, roleColorPalette, makeRoleCssVars } from "../../configs/tokens/tailwind.tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        role: roleColorPalette(tokens),
        // expose neutral scale from palette.json if you have it
        ...(tokens?.neutral ? { neutral: tokens.neutral } : {})
      },
      borderColor: {
        role: "var(--role-border)"
      }
    }
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({ ":root": makeRoleCssVars(tokens) });
    })
  ]
} satisfies Config;
