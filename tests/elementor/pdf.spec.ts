import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-pdf';

// Elementor's PDF widget settings use 'yes'/'' instead of booleans — the
// rendered base64 payload reflects that (`download=yes`). Same iframe class
// (`embedpress-embed-document-pdf`) as the Gutenberg variant.
test.describe('Elementor verify — PDF (default)', () => {
  test('seeded page renders the PDF viewer iframe with download enabled', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run setup` then `npm run seed`').toBeTruthy();

    const iframe = page.locator('iframe.embedpress-embed-document-pdf').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });

    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/sample\.pdf/);

    const keyMatch = src!.match(/#key=([^&]+)/);
    expect(keyMatch).toBeTruthy();
    const params = Buffer.from(keyMatch![1], 'base64').toString();
    expect(params).toContain('download=yes');
    expect(params).toContain('toolbar=true');
  });
});
