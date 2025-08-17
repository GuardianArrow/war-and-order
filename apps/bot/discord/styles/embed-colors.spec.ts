import { describe, it, expect } from 'vitest';
import { embedColorFor } from './embed-colors';

describe('embedColorFor', () => {
  it('uses default palette when no overrides', () => {
    const color = embedColorFor('default', 'primary', '500');
    expect(typeof color).toBe('number');
  });

  it('prefers overrides', () => {
    const color = embedColorFor('default', 'primary', '500', { '--role-primary-500': '#123456' });
    expect(color).toBe(parseInt('123456', 16));
  });

  it('falls back to blurple on nonsense', () => {
    const color = embedColorFor('__missing__', 'primary', '999');
    expect(color).toBe(parseInt('5865F2', 16));
  });
});
