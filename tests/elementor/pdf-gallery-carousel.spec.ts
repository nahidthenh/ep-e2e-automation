import { test, expect } from '@playwright/test';

const SOURCE_NAME = 'PDF Gallery';
const SEEDED_SLUG = 'ep-elementor-pdf-gallery-carousel';

// Carousel layout is Pro-gated. When Pro is inactive the PHP renderer falls
// back silently to 'grid', so we skip if Pro is not installed.
const PRO_REQUIRED = true;

test.beforeAll(async ({ browser }) => {
  if (!PRO_REQUIRED) return;
  const ctx  = await browser.newContext({ storageState: '.auth/state.json' });
  const page = await ctx.newPage();
  await page.goto('/wp-admin/plugins.php');
  const proRow = page.locator('tr[data-plugin^="embedpress-pro/"]:has(.plugin-title)');
  const proActive = (await proRow.count()) === 1
    && (await proRow.evaluate((el) => el.classList.contains('active')));
  await ctx.close();
  test.skip(!proActive, 'EmbedPress Pro inactive — carousel layout is Pro-only; skipping');
});

test.describe(`Elementor verify — ${SOURCE_NAME} (carousel)`, () => {
  test('seeded page renders carousel layout with nav controls and PDF canvas', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const gallery = page.locator('.ep-pdf-gallery[data-layout="carousel"]').first();
    await expect(gallery).toBeVisible({ timeout: 15_000 });

    // Carousel navigation controls must be present
    await expect(gallery.locator('button.ep-pdf-gallery__carousel-prev')).toBeVisible();
    await expect(gallery.locator('button.ep-pdf-gallery__carousel-next')).toBeVisible();

    const canvas = gallery.locator('canvas.ep-pdf-gallery__canvas').first();
    await expect(canvas).toBeVisible();
    const src = await canvas.getAttribute('data-pdf-src');
    expect(src).toMatch(/sample/i);
  });
});
