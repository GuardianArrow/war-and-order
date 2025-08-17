export const dynamic = "force-static";

/** Tailwind role palette is fed by CSS vars created from our tokens plugin.
 *  Neutral uses Tailwind's built-in neutral scale.
 */

const shades = ['50','100','200','300','400','500','600','700','800','900'] as const;

/* ---------- tiny UI helpers ---------- */

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ bgStyle, label }: { bgStyle: React.CSSProperties; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-16 rounded-lg border border-role-border/60 shadow-sm" style={bgStyle} />
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  );
}

function RoleRow({ role }: { role: 'primary' | 'success' | 'warning' | 'danger' }) {
  return (
    <div className="space-y-2">
      <div className="font-medium capitalize">{role}</div>
      <div className="flex flex-wrap gap-3">
        {shades.map((s) => (
          <Swatch
            key={s}
            bgStyle={{ backgroundColor: `var(--role-${role}-${s})` }}
            label={`${role}-${s}`}
          />
        ))}
      </div>
    </div>
  );
}

function NeutralRow() {
  const classes = [
    'bg-neutral-50','bg-neutral-100','bg-neutral-200','bg-neutral-300','bg-neutral-400',
    'bg-neutral-500','bg-neutral-600','bg-neutral-700','bg-neutral-800','bg-neutral-900',
  ];
  return (
    <div className="space-y-2">
      <div className="font-medium">neutral</div>
      <div className="flex flex-wrap gap-3">
        {classes.map((cls) => (
          <div key={cls} className="flex flex-col items-center gap-2">
            <div className={`w-24 h-16 rounded-lg border border-neutral-800 shadow-sm ${cls}`} />
            <div className="text-xs text-neutral-400">{cls.replace('bg-','')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Button({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <button
      className={[
        "px-3 py-2 rounded-lg text-sm font-medium shadow-sm border transition-colors",
        className ?? "",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

/* ---------- page ---------- */

export default function DesignTokensPage() {
  return (
    <main className="p-6 space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Design Tokens</h1>
        <p className="text-neutral-400">
          Palette, typography, buttons, and Discord embed color strips — all wired to our tokens.
        </p>
      </header>

      {/* Palette */}
      <Section title="Color palette">
        <div className="grid gap-6">
          <RoleRow role="primary" />
          <RoleRow role="success" />
          <RoleRow role="warning" />
          <RoleRow role="danger" />
          <NeutralRow />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography scale">
        <div className="space-y-2">
          <div className="text-4xl font-semibold tracking-tight">Heading / 4xl</div>
          <div className="text-3xl font-semibold">Heading / 3xl</div>
          <div className="text-2xl font-semibold">Heading / 2xl</div>
          <div className="text-xl font-semibold">Heading / xl</div>
          <div className="text-lg font-medium">Subheading / lg</div>
          <div className="text-base">Body / base — regular paragraph text.</div>
          <div className="text-sm text-neutral-300">Caption / sm — helper or meta text.</div>
          <div className="text-xs text-neutral-500">Legal / xs — subtle.</div>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button className="bg-role-primary-600 hover:bg-role-primary-500 text-white border-role-primary-700">
            Primary
          </Button>
          <Button className="bg-role-success-600 hover:bg-role-success-500 text-white border-role-success-700">
            Success
          </Button>
          <Button className="bg-role-warning-600 hover:bg-role-warning-500 text-neutral-950 border-role-warning-700">
            Warning
          </Button>
          <Button className="bg-role-danger-600 hover:bg-role-danger-500 text-white border-role-danger-700">
            Danger
          </Button>
          <Button className="border-neutral-700 text-neutral-200 hover:bg-neutral-900">
            Outline
          </Button>
          <Button className="bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800">
            Subtle
          </Button>
        </div>
      </Section>

      {/* Discord embeds */}
      <Section title="Discord embed colors (demo)">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { name: "Info", strip: "bg-role-primary-600" },
            { name: "Success", strip: "bg-role-success-600" },
            { name: "Warning", strip: "bg-role-warning-600" },
            { name: "Danger", strip: "bg-role-danger-600" },
          ].map(({ name, strip }) => (
            <div key={name} className="border border-neutral-800 rounded-lg overflow-hidden">
              <div className="flex">
                <div className={`w-1 ${strip}`} />
                <div className="p-4">
                  <div className="text-sm text-neutral-400">{name}</div>
                  <div className="font-medium">Embed title goes here</div>
                  <div className="text-sm text-neutral-400">
                    Supporting text to approximate Discord embed content.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Text samples on backgrounds */}
      <Section title="Text samples on role backgrounds">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: "Primary 600", bg: "bg-role-primary-600", text: "text-white" },
            { name: "Warning 600", bg: "bg-role-warning-600", text: "text-neutral-950" },
            { name: "Success 600", bg: "bg-role-success-600", text: "text-white" },
            { name: "Danger 600", bg: "bg-role-danger-600", text: "text-white" },
          ].map(({ name, bg, text }) => (
            <div key={name} className={`rounded-lg p-4 ${bg} ${text}`}>
              <div className="font-medium">{name}</div>
              <div className="text-sm opacity-90">Body text on this background</div>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
