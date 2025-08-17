import type { Config } from "tailwindcss";
import palette from "../../configs/tokens/palette.json";
import { roleColorPalette, makeRoleCssVars } from "../../configs/tokens/tailwind.tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // These classes are built via template strings on the tokens page — safelist them
  
  safelist: [
    { pattern: /(bg|text|border|ring)-role-(primary|success|warning|danger|neutral)-(50|100|200|300|400|500|600|700|800|900)/ },
  ],
  theme: {
    extend: {
      colors: { role: roleColorPalette(palette) },
    },
  },
  plugins: [makeRoleCssVars(palette)],
} satisfies Config;
