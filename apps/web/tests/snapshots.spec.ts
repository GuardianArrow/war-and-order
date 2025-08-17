// apps/web/tests/snapshots.spec.ts
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(__dirname, '../../../docs/static/images/design');

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function screenshotTo(page: Page, name: string) {
  ensureOutDir();
  const outPath = path.join(OUT_DIR, name);
  await page.screenshot({ path: outPath, fullPage: true });
  expect(fs.existsSync(outPath)).toBeTruthy();
}

async function prep(page: Page) {
  await page.waitForTimeout(300); // small settle time for fonts/paint
  await page.setViewportSize({ width: 1280, height: 900 });
}

test.describe('Design snapshots', () => {
  test('tokens page (default + midnight)', async ({ page }) => {
    // Default
    await page.goto('/design/tokens', { waitUntil: 'networkidle' });
    await prep(page);
    // Ensure default theme (no attribute)
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await page.waitForTimeout(100);
    await screenshotTo(page, 'design-tokens.png'); // keep legacy filename for docs

    // Midnight (force attribute on <html>)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'midnight'));
    await page.waitForTimeout(100);
    await screenshotTo(page, 'design-tokens-midnight.png');

    // Reset
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  });

  test('components gallery (default + midnight)', async ({ page }) => {
    // Default via query param (page handles data-theme itself)
    await page.goto('/design/components?theme=default', { waitUntil: 'networkidle' });
    await prep(page);
    await screenshotTo(page, 'design-components.png'); // keep legacy filename for docs

    // Midnight via query param (component sets data-theme)
    await page.goto('/design/components?theme=midnight', { waitUntil: 'networkidle' });
    await prep(page);
    await screenshotTo(page, 'design-components-midnight.png');
  });
});
