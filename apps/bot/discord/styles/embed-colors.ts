// Generated: v2025.08 — AMS Discord embed color mapper
// Provides HEX and integer colors for Discord embeds, keyed by semantic tone.

export type EmbedTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'critical' | 'neutral';

export const HEX: Record<EmbedTone, `#${string}`> = {
  brand:   '#4F46E5',
  info:    '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  danger:  '#EF4444',
  critical:'#991B1B',
  neutral: '#64748B',
} as const;

export const INT: Record<EmbedTone, number> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, parseInt(v.slice(1), 16)])
) as Record<EmbedTone, number>;

/** Convert a hex color like #RRGGBB to the Discord embed integer */
export function hexToInt(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Invalid hex: ${hex}`);
  return parseInt(m[1], 16);
}

export type EventStatus = 'Draft' | 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';

export const toneForEventStatus: Record<EventStatus, EmbedTone> = {
  Draft: 'neutral',
  Scheduled: 'info',
  Live: 'brand',
  Completed: 'success',
  Cancelled: 'danger',
};

/** Get embed color integer for a semantic tone */
export function colorFromTone(tone: EmbedTone): number {
  return INT[tone];
}

/** Get embed color integer from an event status */
export function colorFromEventStatus(status: EventStatus): number {
  return colorFromTone(toneForEventStatus[status]);
}

/** Example usage:
 *   const color = colorFromEventStatus('Live'); // int
 *   await channel.send({ embeds: [{ title: 'Live now', color }] });
 */
