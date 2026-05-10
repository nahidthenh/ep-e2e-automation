import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-pdf';

// EmbedPress PDF iframe carries its display options in a base64 payload after
// `#key=` in the iframe src — `download=true|false`, `toolbar=true`, etc.
// Decoding lets us assert on individual options without depending on the
// exact param ordering.
test.describe('Gutenberg verify — PDF (default)', () => {
  test('seeded page renders the PDF viewer iframe with download enabled', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run setup` then `npm run seed`').toBeTruthy();

    const iframe = page.locator('iframe.embedpress-embed-document-pdf').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });

    const src = await iframe.getAttribute('src');
    expect(src, 'iframe src missing').toBeTruthy();
    expect(src).toMatch(/sample\.pdf/);

    const keyMatch = src!.match(/#key=([^&]+)/);
    expect(keyMatch, 'expected base64 key payload after #key=').toBeTruthy();
    const params = Buffer.from(keyMatch![1], 'base64').toString();
    expect(params).toContain('download=true');
    expect(params).toContain('toolbar=true');
  });
});
