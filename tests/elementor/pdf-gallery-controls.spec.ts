import { test, expect } from '@playwright/test';

const SOURCE_NAME = 'PDF Gallery';
const SEEDED_SLUG = 'ep-elementor-pdf-gallery-controls';

// Toolbar and download are Pro-gated: EMBEDPRESS_PRO_PLUGIN_VERSION must be
// defined for the PHP renderer to honour pdf_toolbar='' and download=''.
// Without Pro they always default to 'true' regardless of settings.
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
  test.skip(!proActive, 'EmbedPress Pro inactive — toolbar/download params are Pro-only; skipping');
});

test.describe(`Elementor verify — ${SOURCE_NAME} (controls disabled)`, () => {
  test('viewer-params encodes toolbar=false, download=false, presentation=false', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const gallery = page.locator('.ep-pdf-gallery').first();
    await expect(gallery).toBeVisible({ timeout: 15_000 });

    const encoded = await gallery.getAttribute('data-viewer-params');
    expect(encoded, 'data-viewer-params attribute missing').toBeTruthy();

    const decoded = Buffer.from(encoded!, 'base64').toString('utf8');
    const params  = new URLSearchParams(decoded);

    expect(params.get('toolbar'),      'toolbar should be false').toBe('false');
    expect(params.get('download'),     'download should be false').toBe('false');
    expect(params.get('presentation'), 'presentation should be false').toBe('false');

    // Grid layout with 2 columns — verify columns data attribute
    await expect(gallery).toHaveAttribute('data-columns', '2');

    const canvas = gallery.locator('canvas.ep-pdf-gallery__canvas').first();
    await expect(canvas).toBeVisible();
    const src = await canvas.getAttribute('data-pdf-src');
    expect(src).toMatch(/sample/i);
  });
});
