import palette from "./palette.json";

/** Export tokens as-is from palette.json */
export const tokens = palette as any;

/** Build Tailwind color scales from role tokens */
export function roleColorPalette(t: any) {
  const out: Record<string, Record<string, string>> = {};
  if (!t?.role) return out;
  for (const [name, scale] of Object.entries(t.role)) {
    if (typeof scale !== "object" || scale === null) continue;
    const rec = scale as Record<string, string>;
    out[name] = { ...rec, DEFAULT: rec["500"] ?? Object.values(rec)[0] };
  }
  return out;
}

/** Create CSS vars like --role-primary-500 for every role shade */
export function makeRoleCssVars(t: any) {
  const vars: Record<string, string> = {};
  if (t?.role) {
    for (const [name, scale] of Object.entries(t.role)) {
      if (typeof scale !== "object" || scale === null) continue;
      for (const [shade, hex] of Object.entries(scale as Record<string, string>)) {
        vars[`--role-${name}-${shade}`] = String(hex);
      }
    }
    if (t.role.border) vars["--role-border"] = String(t.role.border);
  }
  return vars;
}
