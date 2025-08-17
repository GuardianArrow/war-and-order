// apps/web/tests/snapshots.spec.ts
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(__dirname, '../../../docs/static/images/design');

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function snap(page: Page, url: string, name: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300); // small settle time for fonts/paint
  await page.setViewportSize({ width: 1280, height: 900 });
  ensureOutDir();
  const outPath = path.join(OUT_DIR, name);
  await page.screenshot({ path: outPath, fullPage: true });
  // Basic sanity: file exists
  expect(fs.existsSync(outPath)).toBeTruthy();
}

test.describe('Design snapshots', () => {
  test('tokens page', async ({ page }) => {
    await snap(page, '/design/tokens', 'design-tokens.png');
  });

  test('components gallery', async ({ page }) => {
    await snap(page, '/design/components', 'design-components.png');
  });
});
