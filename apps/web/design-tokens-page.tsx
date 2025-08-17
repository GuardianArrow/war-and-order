import React from 'react'

// Keep this page server-rendered. It does not import repo tokens directly
// to avoid monorepo import config issues; it smoke-tests Tailwind classes.

const shades = ['50','100','200','300','400','500','600','700','800','900'] as const

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-24 h-16 rounded-lg border border-role-border shadow-sm ${className}`} />
      <div className="text-xs text-neutral-300">{label}</div>
    </div>
  )
}

function ColorRow({ prefix }: { prefix: string }) {
  return (
    <div className="flex flex-wrap gap-4">
      {shades.map(s => (
        <Swatch key={s} className={`bg-${prefix}-${s}`} label={`${prefix}-${s}`} />
      ))}
    </div>
  )
}

function ColorSingles() {
  const singles = [
    ['role-primary','bg-role-primary'],
    ['role-secondary','bg-role-secondary'],
    ['role-accent','bg-role-accent'],
    ['role-muted','bg-role-muted'],
    ['semantic-positive','bg-semantic-positive'],
    ['semantic-warning','bg-semantic-warning'],
    ['semantic-negative','bg-semantic-negative'],
    ['semantic-info','bg-semantic-info'],
    ['discord-default','bg-discord-default'],
    ['discord-success','bg-discord-success'],
    ['discord-warning','bg-discord-warning'],
    ['discord-danger','bg-discord-danger'],
    ['discord-info','bg-discord-info'],
  ] as const

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {singles.map(([label, cls]) => (
        <Swatch key={label} className={cls} label={label} />
      ))}
    </div>
  )
}

export default function DesignTokensPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Design Tokens — Smoke Test</h1>
        <p className="text-neutral-300">Palette, roles, typography, radii & shadows wired via Tailwind.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Brand</h2>
        <ColorRow prefix="brand" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Neutral</h2>
        <ColorRow prefix="neutral" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Roles & Semantic</h2>
        <ColorSingles />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-medium">Typography</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-4xl font-semibold">Heading 1 — 4xl</div>
            <div className="text-3xl font-semibold">Heading 2 — 3xl</div>
            <div className="text-2xl font-semibold">Heading 3 — 2xl</div>
            <div className="text-xl font-semibold">Heading 4 — xl</div>
            <div className="text-lg font-medium">Heading 5 — lg</div>
          </div>
          <div className="space-y-2">
            <p className="text-base">Body — base. The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm">Body — sm. The quick brown fox jumps over the lazy dog.</p>
            <p className="text-xs uppercase tracking-wide text-neutral-300">Caption — xs / uppercase</p>
            <code className="block text-sm bg-neutral-900 rounded-md p-3 shadow border border-role-border">
              const hello = 'world' // mono sample
            </code>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-medium">Radii</h2>
        <div className="flex flex-wrap gap-4">
          {['sm','md','lg','xl','2xl','full'].map(r => (
            <div key={r} className={`w-28 h-16 bg-neutral-800 border border-role-border shadow-sm rounded-${r} grid place-items-center`}>
              <span className="text-xs text-neutral-300">{r}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-medium">Shadows</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            ['shadow-sm','shadow-sm'],
            ['shadow (default)','shadow'],
            ['shadow-md','shadow-md'],
            ['shadow-lg','shadow-lg'],
            ['shadow-xl','shadow-xl'],
          ].map(([label, cls]) => (
            <div key={label} className={`bg-neutral-900 border border-role-border rounded-lg p-4 ${cls}`}>
              <div className="text-sm">{label}</div>
              <div className="text-neutral-300 text-xs">Card with some content to see elevation.</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}