import type { Config } from "tailwindcss";
import { tokens, roleColorPalette } from "../../configs/tokens/tailwind.tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],

  // Generate dynamic role-* utilities used on the tokens page
  safelist: [
    { pattern: /bg-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /border-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],

  theme: {
    extend: {
      colors: {
        role: roleColorPalette(tokens),
      },
    },
  },
  plugins: [],
} satisfies Config;
