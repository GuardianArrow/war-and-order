export const dynamic = "force-static";

const SHADES = ["50","100","200","300","400","500","600","700","800","900"] as const;
const ROLES = [
  { key: "role-primary", label: "Primary" },
  { key: "role-success", label: "Success" },
  { key: "role-warning", label: "Warning" },
  { key: "role-danger",  label: "Danger"  },
  { key: "role-neutral", label: "Neutral" },
];

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-24 h-10 rounded-md border border-role-neutral-700 shadow-sm ${className}`} />
      <div className="text-xs text-neutral-300">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium text-neutral-200">{title}</h2>
      {children}
    </section>
  );
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm border ${className}`} >
      {children}
    </span>
  );
}

export default function DesignTokensPage() {
  return (
    <main className="p-6 space-y-10">
      <div className="text-sm text-neutral-400">
        <strong className="text-neutral-200">Design Tokens</strong>
        <span className="ml-2">Palette, typography, buttons, and Discord embed color strips — all wired to our tokens.</span>
      </div>

      {/* Color palette */}
      <Section title="Color palette">
        <div className="space-y-6">
          {ROLES.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="text-sm text-neutral-400">{label}</div>
              <div className="flex flex-wrap gap-3">
                {SHADES.map((s) => (
                  <Swatch key={s} className={`bg-${key}-${s}`} label={`${label.toLowerCase()}-${s}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography scale">
        <div className="space-y-2">
          <div className="text-4xl font-bold">Heading / 4xl</div>
          <div className="text-3xl font-semibold">Heading / 3xl</div>
          <div className="text-2xl font-semibold">Heading / 2xl</div>
          <div className="text-lg font-medium">Heading / lg</div>
          <div className="text-base">Body / base — regular paragraph text.</div>
          <div className="text-sm text-neutral-500">Caption / sm — helper or meta text.</div>
          <div className="text-xs text-neutral-500">Legal — / xs…</div>
        </div>
      </Section>

      {/* Buttons (chips) */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Chip className="bg-role-primary-600 text-white border-role-primary-700">Primary</Chip>
          <Chip className="bg-role-success-600 text-white border-role-success-700">Success</Chip>
          <Chip className="bg-role-warning-600 text-neutral-900 border-role-warning-700">Warning</Chip>
          <Chip className="bg-role-danger-600 text-white border-role-danger-700">Danger</Chip>
          <Chip className="bg-role-neutral-700 text-neutral-100 border-role-neutral-600">Subtle</Chip>
        </div>
      </Section>

      {/* Discord embed color demos */}
      <Section title="Discord embed colors (demo)">
        <div className="space-y-4">
          <EmbedDemo kind="primary" title="Info" />
          <EmbedDemo kind="success" title="Success" />
          <EmbedDemo kind="danger"  title="Danger" />
        </div>
      </Section>

      {/* Text samples on role backgrounds */}
      <Section title="Text samples on role backgrounds">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextSample bg="bg-role-primary-600" label="Primary 600" />
          <TextSample bg="bg-role-neutral-800" label="Neutral 800" />
        </div>
      </Section>
    </main>
  );
}

/* ——— helpers ——— */

function EmbedDemo({ kind, title }: { kind: "primary"|"success"|"danger"; title: string }) {
  return (
    <div className={`rounded-md border p-3 bg-neutral-950 border-role-neutral-700`}>
      <div className={`text-sm font-medium mb-1 text-role-${kind}-400`}>{title}</div>
      <div className="text-xs text-neutral-400">Embed title goes here</div>
      <div className="text-xs text-neutral-500">Supporting text to approximate Discord embed content.</div>
    </div>
  );
}

function TextSample({ bg, label }: { bg: string; label: string }) {
  return (
    <div className={`rounded-md p-4 border border-role-neutral-700 ${bg}`}>
      <div className="text-sm font-medium text-neutral-100">{label}</div>
      <div className="text-xs text-neutral-300">Body text on this background</div>
    </div>
  );
}
