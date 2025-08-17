// apps/web/tests/tokens.spec.ts
import { test, expect } from '@playwright/test';

test('Design Tokens page renders and shows palette', async ({ page }) => {
  await page.goto('/design/tokens');

  await expect(page.getByRole('heading', { name: 'Design Tokens' })).toBeVisible();
  await expect(page.getByText('Color palette')).toBeVisible();

  // Grab a few canonical swatches by test id
  const primary = page.getByTestId('swatch-primary-500');
  const success = page.getByTestId('swatch-success-500');
  const warning = page.getByTestId('swatch-warning-500');

  await expect(primary).toBeVisible();
  await expect(success).toBeVisible();
  await expect(warning).toBeVisible();

  // Assert they actually have a non-transparent background color
  await expect(primary).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(success).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(warning).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});