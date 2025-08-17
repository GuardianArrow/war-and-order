'use client';

export default function ButtonPreview({ tokenVar }: { tokenVar: string; }) {
  const color = `var(${tokenVar})`;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="rounded-xl border px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
              style={{ background: color, borderColor: color }}>Primary</button>

      <button className="rounded-xl border px-4 py-2 text-sm font-medium"
              style={{ borderColor: color, color }}>Outline</button>

      <button className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted"
              style={{ color }}>Ghost</button>

      <button className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: color, borderColor: color, color: 'white' }} disabled>
        Disabled
      </button>
    </div>
  );
}