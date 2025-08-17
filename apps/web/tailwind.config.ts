import type { Config } from "tailwindcss";
import { tokens, roleColorPalette, makeRoleCssVars } from "../../configs/tokens/tailwind.tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        role: roleColorPalette(tokens),
      },
    },
  },
  // Register CSS variables like --role-primary-500 at :root
  plugins: [
    ({ addBase }: any) => {
      addBase({ ':root': makeRoleCssVars(tokens) });
    },
  ],
} satisfies Config;
