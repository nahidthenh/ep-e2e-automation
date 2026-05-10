import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-pdf-no-download';

// Same iframe shape as the default variant, but the block was seeded with
// `download: false` — the base64 payload after `#key=` should reflect that.
test.describe('Gutenberg verify — PDF (download disabled)', () => {
  test('seeded page renders the PDF viewer iframe with download=false', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run setup` then `npm run seed`').toBeTruthy();

    const iframe = page.locator('iframe.embedpress-embed-document-pdf').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });

    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/sample\.pdf/);

    const keyMatch = src!.match(/#key=([^&]+)/);
    expect(keyMatch).toBeTruthy();
    const params = Buffer.from(keyMatch![1], 'base64').toString();
    expect(params, 'expected `download=false` since the variant disables download').toContain('download=false');
  });
});
