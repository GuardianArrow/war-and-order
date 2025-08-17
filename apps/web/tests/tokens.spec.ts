import { test, expect } from '@playwright/test';

test('Design Tokens page renders and shows palette', async ({ page }) => {
  await page.goto('/design/tokens');

  await expect(page.getByText('Design Tokens')).toBeVisible();
  await expect(page.getByText('Color palette')).toBeVisible();

  // Spot-check a few labels that should be present
  await expect(page.getByText('primary-500')).toBeVisible();
  await expect(page.getByText('success-500')).toBeVisible();
  await expect(page.getByText('warning-500')).toBeVisible();

  // A swatch div with the Tailwind class should exist
  const primary500 = page.locator('.bg-primary-500').first();
  await expect(primary500).toBeVisible();
});
