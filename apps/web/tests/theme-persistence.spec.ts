// apps/web/tests/theme-persistence.spec.ts
import { test, expect } from '@playwright/test';

test('theme persists across pages (via next-themes)', async ({ page }) => {
  // 1) Set to midnight on the components gallery
  await page.goto('/design/components?theme=midnight', { waitUntil: 'networkidle' });

  // Wait until next-themes applies the attribute
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-theme') === 'midnight'
  );

  // Confirm localStorage persistence
  const stored = await page.evaluate(() => localStorage.getItem('wao-theme'));
  expect(stored).toBe('midnight');

  // 2) Navigate elsewhere; attribute should remain
  await page.goto('/design/tokens', { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-theme') === 'midnight'
  );

  // 3) Cleanup for other tests (optional but polite)
  await page.evaluate(() => {
    localStorage.removeItem('wao-theme');
  });
});