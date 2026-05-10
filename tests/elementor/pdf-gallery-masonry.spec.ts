import { test, expect } from '@playwright/test';

const SOURCE_NAME = 'PDF Gallery';
const SEEDED_SLUG = 'ep-elementor-pdf-gallery-masonry';

test.describe(`Elementor verify — ${SOURCE_NAME} (masonry)`, () => {
  test('seeded page renders masonry layout with PDF canvas', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const gallery = page.locator('.ep-pdf-gallery[data-layout="masonry"]').first();
    await expect(gallery).toBeVisible({ timeout: 15_000 });

    const canvas = gallery.locator('canvas.ep-pdf-gallery__canvas').first();
    await expect(canvas).toBeVisible();
    const src = await canvas.getAttribute('data-pdf-src');
    expect(src).toMatch(/sample/i);
  });
});
