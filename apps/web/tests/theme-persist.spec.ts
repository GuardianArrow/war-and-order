import { test, expect } from '@playwright/test';

test('theme persists across pages', async ({ page }) => {
  await page.goto('/design/components?theme=midnight');
  await page.waitForTimeout(200);
  // Should write localStorage["wao-theme"] and set attribute
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(attr).toBe('midnight');

  await page.goto('/design/tokens');
  const attr2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(attr2).toBe('midnight');
});
