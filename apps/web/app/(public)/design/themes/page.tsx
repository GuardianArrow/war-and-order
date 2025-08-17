// apps/web/app/(public)/design/themes/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type TokenOverrideMap = Record<string, string>;
type GuildThemeConfig = {
  guildId: string;
  themeKey: string;
  overrides?: TokenOverrideMap;
  updatedAt: string;
  updatedBy?: string;
};

const KNOWN_THEMES = ['default', 'midnight'];

export default function ThemeAdminPage() {
  const [guildId, setGuildId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<GuildThemeConfig | null>(null);
  const [pendingThemeKey, setPendingThemeKey] = useState<string>('default');
  const [edits, setEdits] = useState<TokenOverrideMap>({});
  const [clearList, setClearList] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');

  // Load any last used guildId from localStorage (nice DX)
  useEffect(() => {
    const g = localStorage.getItem('admin-guildId');
    if (g) setGuildId(g);
  }, []);

  async function load() {
    if (!guildId.trim()) return;
    localStorage.setItem('admin-guildId', guildId);
    setLoading(true);
    setStatus('Loading…');
    try {
      const res = await fetch(`/api/themes/${encodeURIComponent(guildId)}`);
      const data = (await res.json()) as GuildThemeConfig;
      setCfg(data);
      setPendingThemeKey(data.themeKey || 'default');
      setEdits({});
      setClearList([]);
      setStatus('Loaded');
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!guildId.trim()) return;
    setLoading(true);
    setStatus('Saving…');
    try {
      const body: any = {};
      if (pendingThemeKey && pendingThemeKey !== cfg?.themeKey) body.themeKey = pendingThemeKey;
      if (Object.keys(edits).length) body.overrides = edits;
      if (clearList.length) body.clear = clearList;

      const res = await fetch(`/api/themes/${encodeURIComponent(guildId)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as GuildThemeConfig;
      setCfg(data);
      setPendingThemeKey(data.themeKey || 'default');
      setEdits({});
      setClearList([]);
      setStatus('Saved ✔');
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function addOverride() {
    const name = prompt('CSS var (e.g., --role-primary-500)');
    if (!name) return;
    const value = prompt('Hex value (#RRGGBB)');
    if (!value) return;
    setEdits((p) => ({ ...p, [name]: value }));
  }

  function queueClear(name: string) {
    setClearList((p) => (p.includes(name) ? p : [...p, name]));
  }

  const mergedOverrides = useMemo(() => {
    const base = { ...(cfg?.overrides ?? {}) };
    for (const [k, v] of Object.entries(edits)) base[k] = v;
    for (const k of clearList) delete (base as any)[k];
    return base;
  }, [cfg?.overrides, edits, clearList]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/design/tokens" className="underline decoration-dotted">Tokens</Link>
          <span className="px-1">/</span>
          <span className="text-foreground">Theme Admin</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">Theme Admin</h1>
        <p className="text-sm text-muted-foreground">Edit the per-guild theme and ad-hoc overrides.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-[1fr_auto_auto] items-end">
        <div>
          <label className="text-xs text-muted-foreground">Guild ID</label>
          <input
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            placeholder="123456789012345678"
            className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={load}
          disabled={!guildId || loading}
          className="h-9 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-50"
        >
          Load
        </button>
        <button
          onClick={save}
          disabled={!cfg || loading}
          className="h-9 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-50"
        >
          Save changes
        </button>
      </section>

      {cfg && (
        <>
          <section className="space-y-3">
            <div className="text-xs text-muted-foreground">Theme</div>
            <div className="flex items-center gap-3">
              <select
                className="rounded-md border bg-transparent px-3 py-2 text-sm"
                value={pendingThemeKey}
                onChange={(e) => setPendingThemeKey(e.target.value)}
              >
                {KNOWN_THEMES.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground">
                Current:&nbsp;<code>{cfg.themeKey}</code>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Overrides</div>
              <div className="flex gap-2">
                <button onClick={addOverride} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">+ Add</button>
              </div>
            </div>

            <div className="grid gap-2">
              {Object.entries(mergedOverrides).length === 0 && (
                <div className="text-xs text-muted-foreground">No overrides.</div>
              )}

              {Object.entries(mergedOverrides).map(([name, value]) => (
                <div key={name} className="flex items-center gap-2">
                  <code className="min-w-[220px] rounded-md border bg-card/60 px-2 py-1 text-xs">{name}</code>
                  <input
                    defaultValue={value}
                    onChange={(e) => setEdits((p) => ({ ...p, [name]: e.target.value }))}
                    className="flex-1 rounded-md border bg-transparent px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => queueClear(name)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  >
                    clear
                  </button>
                </div>
              ))}
            </div>
          </section>

          <footer className="text-xs text-muted-foreground">
            {status}
          </footer>
        </>
      )}
    </main>
  );
}
