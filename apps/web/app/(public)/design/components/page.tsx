// apps/web/app/(public)/design/components/page.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import TokenVarPicker from '@/components/design/TokenVarPicker';
import PreviewCard from '@/components/design/PreviewCard';
import DiscordEmbedPreview from '@/components/design/DiscordEmbedPreview';
import ButtonPreview from '@/components/design/ButtonPreview';
import AlertPreview from '@/components/design/AlertPreview';

export default function ComponentsGalleryPage() {
  // Default to a role var known to exist; picker can change it live
  const [selectedVar, setSelectedVar] = useState<string>('--role-war-commander');

  const styleVar = useMemo(
    () => ({
      // Optional shared accent var for nested examples
      ['--accent' as any]: `var(${selectedVar})`,
    }),
    [selectedVar]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/design/tokens" className="underline decoration-dotted">Tokens</Link>
          <span className="px-1">/</span>
          <span className="text-foreground">Components</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight">Design Components</h1>
        <p className="text-sm text-muted-foreground">
          Live previews of UI elements driven by your token CSS variables. Pick any token below and the components will update.
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
