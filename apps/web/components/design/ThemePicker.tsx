'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const THEMES = ['default', 'midnight'] as const;

export default function ThemePicker() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch (next-themes pattern)
  useEffect(() => setMounted(true), []);
  const current = (theme ?? resolvedTheme ?? 'default') as string;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Theme:</span>
      {THEMES.map(t => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={[
            'rounded-lg border px-2.5 py-1 transition',
            current === t
              ? 'bg-role-neutral-800 text-white'
              : 'hover:bg-role-neutral-900'
          ].join(' ')}
          type="button"
          aria-pressed={current === t}
        >
          {t}
        </button>
      ))}
      <span className="text-muted-foreground">
        current: {mounted ? current : '…'}
      </span>
    </div>
  );
}