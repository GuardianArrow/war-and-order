// apps/web/app/(public)/design/components/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import TokenVarPicker from '@/components/design/TokenVarPicker';
import PreviewCard from '@/components/design/PreviewCard';
import DiscordEmbedPreview from '@/components/design/DiscordEmbedPreview';
import ButtonPreview from '@/components/design/ButtonPreview';
import AlertPreview from '@/components/design/AlertPreview';

export default function ComponentsGalleryPage() {
  // Persist theme via next-themes (works across pages)
  const { theme, setTheme } = useTheme();
  const themeParam = useSearchParams().get('theme'); // e.g. 'midnight' | 'default'

  useEffect(() => {
    if (themeParam) setTheme(themeParam);
  }, [themeParam, setTheme]);

  // Token var used by previews (independent of theme)
  const [selectedVar, setSelectedVar] = useState<string>('--role-war-commander');

  const styleVar = useMemo(
    () => ({
      // Optional shared accent var for nested examples
      ['--accent' as any]: `var(${selectedVar})`,
    }),
    [selectedVar]
  );

  const shownTheme = theme ?? themeParam ?? 'default';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <nav className="text-sm text-muted-foreground">
            <Link href="/design/tokens" className="underline decoration-dotted">
              Tokens
            </Link>
            <span className="px-1">/</span>
            <span className="text-foreground">Components</span>
          </nav>

          {/* Tiny theme helpers for demos */}
          <div className="text-xs text-muted-foreground">
            Theme:&nbsp;
            <code className="rounded bg-card/60 px-1 py-0.5 border">{shownTheme}</code>
            <span className="mx-2">·</span>
            <Link href="/design/components?theme=default" className="underline decoration-dotted">
              default
            </Link>
            <span className="mx-1">/</span>
            <Link href="/design/components?theme=midnight" className="underline decoration-dotted">
              midnight
            </Link>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Design Components</h1>
        <p className="text-sm text-muted-foreground">
          Live previews of UI elements driven by your token CSS variables. Pick any token below and
          the components will update. Add <code>?theme=midnight</code> to the URL to preview other
          themes; your choice persists across pages.
        </p>
      </header>

      <TokenVarPicker value={selectedVar} onChange={setSelectedVar} />

      <section style={styleVar} className="grid gap-6 md:grid-cols-2">
        <PreviewCard title="Discord Embed">
          <DiscordEmbedPreview tokenVar={selectedVar} />
        </PreviewCard>

        <PreviewCard title="Buttons">
          <ButtonPreview tokenVar={selectedVar} />
        </PreviewCard>

        <PreviewCard title="Alerts">
          <AlertPreview tokenVar={selectedVar} />
        </PreviewCard>
      </section>

      <footer className="pt-4 text-sm">
        <Link href="/design/tokens" className="inline-flex items-center gap-1 underline decoration-dotted">
          ← Back to Tokens
        </Link>
      </footer>
    </div>
  );
}
