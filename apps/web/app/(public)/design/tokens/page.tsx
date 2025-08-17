export const dynamic = "force-static";

const shades = ['50','100','200','300','400','500','600','700','800','900'] as const;

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-24 h-16 rounded-lg border border-role shadow-sm ${className}`} />
      <div className="text-xs text-neutral-300">{label}</div>
    </div>
  );
}

function ColorRow({ prefix }: { prefix: string }) {
  return (
    <div className="flex flex-wrap gap-4">
      {shades.map((s) => (
        <Swatch key={s} className={`bg-${prefix}-${s}`} label={`${prefix}-${s}`} />
      ))}
    </div>
  );
}

export default function DesignTokensPage() {
  const roles = ["primary","secondary","success","warning","danger","neutral"];
  return (
    <main className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Design Tokens</h1>

      <section className="space-y-6">
        <h2 className="text-xl font-medium">Role Colors</h2>
        <div className="space-y-8">
          {roles.map((r) => (
            <div key={r} className="space-y-3">
              <div className="text-sm font-medium capitalize">{r}</div>
              <ColorRow prefix={`role-${r}`} />
            </div>
          ))}
        </div>
        <div className="mt-6 text-sm text-neutral-500">
          Border token preview: <span className="inline-block align-middle w-6 h-6 border border-role rounded-md" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Typography scale</h2>
        <div className="space-y-2">
          <div className="text-3xl">text-3xl — Headline</div>
          <div className="text-2xl">text-2xl — Section</div>
          <div className="text-xl">text-xl — Subsection</div>
          <div className="text-lg">text-lg — Body large</div>
          <div>text-base — Body</div>
          <div className="text-sm text-neutral-400">text-sm — Helper / subtle</div>
          <div className="text-xs text-neutral-500">text-xs — Meta</div>
        </div>
      </section>
    </main>
  );
}
