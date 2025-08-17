'use client';

export default function AlertPreview({ tokenVar }: { tokenVar: string; }) {
  const color = `var(${tokenVar})`;
  return (
    <div className="space-y-3">
      <AlertBox tone="Info" message="This is a general notice. Timings auto-sync hourly." color={color} />
      <AlertBox tone="Success" message="Embed theme connected to tokens successfully!" color={color} />
      <AlertBox tone="Warning" message="Rally fills below 80% — ping leads and backup." color={color} />
      <AlertBox tone="Error" message="Failed to fetch alliance data — check API key." color={color} />
    </div>
  );
}

function AlertBox({ tone, message, color }: { tone: string; message: string; color: string; }) {
  return (
    <div className="rounded-xl border p-3 text-sm shadow-sm" style={{ borderColor: color, background: 'color-mix(in oklab, var(--background) 86%, ' + color + ' 14%)' }}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <div>
          <div className="font-medium">{tone}</div>
          <div className="opacity-80">{message}</div>
        </div>
      </div>
    </div>
  );
}