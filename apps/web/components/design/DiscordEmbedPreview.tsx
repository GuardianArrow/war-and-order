'use client';

// A lightweight visual approximation of a Discord embed card
// Accent bar and link accents use the provided CSS variable.

export default function DiscordEmbedPreview({ tokenVar }: { tokenVar: string; }) {
  const accent = `var(${tokenVar})`;
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="flex gap-3">
        <div className="h-auto w-1 shrink-0 rounded bg-[var(--accent-color)]" style={{ ['--accent-color' as any]: accent }} />
        <div className="flex-1 space-y-2">
          <div className="text-sm text-muted-foreground">@Bot • Today at 09:41</div>
          <div className="space-y-1">
            <div className="text-lg font-semibold">Raid Plan: Nightfall</div>
            <div className="text-sm leading-relaxed">
              Assemble at <a className="underline decoration-dotted text-[var(--accent-color)]" style={{ ['--accent-color' as any]: accent }} href="#">Fort Blackstone</a>.
              Fill rallies by :55. Use SA then chain SOS. Scouts post intel threads.
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <EmbedField title="Rally Leads" value="AxeLord, EmberFox, Nebula" />
            <EmbedField title="Troop Mix" value="60% Cav / 40% Inf (no archers)" />
          </div>
          <div className="pt-2 text-xs text-muted-foreground">Footer • IDs sync’d • <span style={{ color: accent }}>{tokenVar}</span></div>
        </div>
      </div>
    </div>
  );
}

function EmbedField({ title, value }: { title: string; value: string; }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wide opacity-70">{title}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}