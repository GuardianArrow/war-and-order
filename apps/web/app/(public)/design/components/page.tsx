'use client';

import { useMemo, useState } from 'react';
import TokenVarPicker from '@/components/design/TokenVarPicker';
import PreviewCard from '@/components/design/PreviewCard';
import DiscordEmbedPreview from '@/components/design/DiscordEmbedPreview';
import ButtonPreview from '@/components/design/ButtonPreview';
import AlertPreview from '@/components/design/AlertPreview';

export default function ComponentsGalleryPage() {
  // Default to the first role-ish var we can find at runtime; fallback to a common name
  const [selectedVar, setSelectedVar] = useState<string>('--role-war-commander');

  const styleVar = useMemo(() => ({
    // Common "accent" custom property that children can reference if they want nesting patterns
    // but components below bind directly to the token with arbitrary Tailwind values
    // Keeping this for potential nesting / theming scope examples.
    ['--accent' as any]: `var(${selectedVar})`,
  }), [selectedVar]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
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
    </div>
  );
}