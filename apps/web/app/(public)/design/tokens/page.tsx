export const dynamic = "force-static";

const shades = ['50','100','200','300','400','500','600','700','800','900'] as const;

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-24 h-16 rounded-lg border border-neutral-700 shadow-sm"
        style={{ background: `var(${varName})` }}
      />
      <div className="text-xs text-neutral-300">{label}</div>
    </div>
  );
}

function ColorRow({ role }: { role: 'primary'|'success'|'warning'|'danger'|'neutral' }) {
  return (
    <div className="flex flex-wrap gap-4">
      {shades.map((s) => (
        <Swatch key={s} varName={`--role-${role}-${s}`} label={`${role}-${s}`} />
      ))}
    </div>
  );
}

export default function DesignTokensPage() {
  return (
    <main className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Design Tokens</h1>
        <p className="text-sm text-neutral-400">
          Palette, typography, buttons, and Discord embed color strips — all wired to our tokens.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Color palette</h2>
        <div className="space-y-3">
          <h3 className="text-sm text-neutral-400">Primary</h3>
          <ColorRow role="primary" />
          <h3 className="text-sm text-neutral-400 mt-4">Success</h3>
          <ColorRow role="success" />
          <h3 className="text-sm text-neutral-400 mt-4">Warning</h3>
          <ColorRow role="warning" />
          <h3 className="text-sm text-neutral-400 mt-4">Danger</h3>
          <ColorRow role="danger" />
          <h3 className="text-sm text-neutral-400 mt-4">Neutral</h3>
          <ColorRow role="neutral" />
        </div>
      </section>
    </main>
  );
}
