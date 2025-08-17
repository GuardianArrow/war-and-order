'use client';

import { useEffect, useMemo, useState } from 'react';

function readAllCssVars(): string[] {
  const out = new Set<string>();
  // Check :root computed styles
  const root = getComputedStyle(document.documentElement);
  for (let i = 0; i < root.length; i++) {
    const name = root[i];
    if (name.startsWith('--')) out.add(name);
  }
  // Also scan inline styles if any (defensive)
  const inline = document.documentElement.style;
  for (let i = 0; i < inline.length; i++) {
    const name = inline[i];
    if (name.startsWith('--')) out.add(name);
  }
  return Array.from(out);
}

function humanLabel(name: string) {
  return name.replace(/^--/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function TokenVarPicker({ value, onChange }: { value: string; onChange: (v: string) => void; }) {
  const [vars, setVars] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setVars(readAllCssVars());
  }, []);

  const grouped = useMemo(() => {
    const list = vars
      .filter(v => v.includes(query.trim()))
      .sort();

    const buckets: Record<string, string[]> = { Role: [], Palette: [], Other: [] };
    for (const v of list) {
      if (/--role-/.test(v)) buckets.Role.push(v);
      else if (/--palette-/.test(v) || /--color-/.test(v) || /--brand-/.test(v)) buckets.Palette.push(v);
      else buckets.Other.push(v);
    }
    return buckets;
  }, [vars, query]);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-medium">Token Variable</h2>
          <p className="text-xs text-muted-foreground">Choose any CSS variable exposed by your token system.</p>
        </div>
        <input
          className="w-full md:w-72 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="Filter (e.g. role, palette)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {(['Role','Palette','Other'] as const).map(section => (
          <div key={section} className="space-y-2">
            <h3 className="text-sm font-semibold opacity-70">{section}</h3>
            <div className="max-h-64 overflow-auto rounded-xl border">
              <ul className="divide-y text-sm">
                {grouped[section].map(name => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => onChange(name)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent ${value === name ? 'bg-accent/50' : ''}`}
                    >
                      <span className="truncate" title={name}>{humanLabel(name)}</span>
                      <span
                        className="ml-2 h-4 w-4 shrink-0 rounded-full border"
                        style={{ background: `var(${name})` }}
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
                {grouped[section].length === 0 && (
                  <li className="px-3 py-2 text-muted-foreground">No matches</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="opacity-70">Selected:</span>
        <code className="rounded bg-muted px-2 py-1">{value}</code>
        <span className="ml-2 h-4 w-4 rounded-full border" style={{ background: `var(${value})` }} aria-hidden />
      </div>
    </div>
  );
}