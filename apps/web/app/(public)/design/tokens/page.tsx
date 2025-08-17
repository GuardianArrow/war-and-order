// apps/web/app/(public)/design/tokens/page.tsx
import Link from 'next/link';

export const dynamic = "force-static";

const shades = ['50','100','200','300','400','500','600','700','800','900'] as const;

function Swatch({
  className,
  label,
  testId,
}: {
  className: string;
  label: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        data-testid={testId}
        className={`w-24 h-16 rounded-lg border border-role-border shadow-sm ${className}`}
        aria-label={label}
      />
      <div className="text-xs text-neutral-300">{label}</div>
    </div>
  );
}

function ColorRow({ prefix }: { prefix: 'primary'|'success'|'warning'|'danger'|'neutral' }) {
  return (
    <div className="flex flex-wrap gap-4">
      {shades.map((s) => (
        <Swatch
          key={s}
          className={`bg-role-${prefix}-${s}`}
          label={`${prefix}-${s}`}
          testId={`swatch-${prefix}-${s}`}
        />
      ))}
    </div>
  );
}

export default function DesignTokensPage() {
  return (
    <main className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">Design Tokens</h1>

      <section className="space-y-4">
        <h2 className="text-sm text-neutral-400">Color palette</h2>

        <div className="space-y-2">
          <div className="text-xs text-neutral-400">Primary</div>
          <ColorRow prefix="primary" />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-400">Success</div>
          <ColorRow prefix="success" />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-400">Warning</div>
          <ColorRow prefix="warning" />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-400">Danger</div>
          <ColorRow prefix="danger" />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-400">Neutral</div>
          <ColorRow prefix="neutral" />
        </div>
      </section>

      {/* Link to Components Gallery */}
      <div className="mt-10">
        <Link
          href="/design/components"
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          → View Components Gallery
        </Link>
      </div>
    </main>
  );
}