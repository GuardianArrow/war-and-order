import { describe, it, expect } from 'vitest';
import { embedColorFor } from '../discord/styles/embed-colors';

describe('embedColorFor()', () => {
  it('differs between default and midnight (primary-500)', () => {
    const d = embedColorFor('default', 'primary', '500');
    const m = embedColorFor('midnight', 'primary', '500');
    expect(d).not.toBe(m);
  });

  it('applies overrides with precedence', () => {
    const color = embedColorFor('default', 'primary', '500', { '--role-primary-500': '#123456' });
    expect(color).toBe(parseInt('123456', 16));
  });
});
