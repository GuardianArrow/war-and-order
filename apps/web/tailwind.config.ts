// apps/web/tailwind.config.ts
import type { Config } from "tailwindcss";
import { tokens, roleColorPalette } from "../../configs/tokens/tailwind.tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],

  // Tell Tailwind to generate dynamic role-* utilities we use on the tokens page
  safelist: [
    { pattern: /bg-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /border-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],

  theme: {
    extend: {
      colors: {
        role: roleColorPalette(tokens), // { primary: {50..900}, success: {...}, ... }
      },
    },
  },
  plugins: [],
} satisfies Config;