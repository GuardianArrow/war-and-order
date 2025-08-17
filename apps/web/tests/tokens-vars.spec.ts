import { test, expect } from '@playwright/test';

test('role CSS vars are injected', async ({ page }) => {
  await page.goto('/design/tokens');
  // Check one of the CSS custom properties we generate, e.g. --role-primary-500
  const hasVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--role-primary-500').trim().length > 0
  );
  expect(hasVar).toBeTruthy();
});
