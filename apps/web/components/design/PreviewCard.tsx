import { ReactNode } from 'react';

export default function PreviewCard({ title, children }: { title: string; children: ReactNode; }) {
  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="min-h-24">{children}</div>
    </div>
  );
}