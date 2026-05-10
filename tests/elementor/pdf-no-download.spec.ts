import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-pdf-no-download';

test.describe('Elementor verify — PDF (download disabled)', () => {
  test('seeded page renders the PDF viewer iframe without download', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run setup` then `npm run seed`').toBeTruthy();

    const iframe = page.locator('iframe.embedpress-embed-document-pdf').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });

    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/sample\.pdf/);

    const keyMatch = src!.match(/#key=([^&]+)/);
    expect(keyMatch).toBeTruthy();
    const params = Buffer.from(keyMatch![1], 'base64').toString();
    // Elementor renders disabled toggles as either empty string or 'no' depending
    // on the widget's setting shape. Either disables the button.
    expect(params, 'expected download to be disabled — saw: ' + params).toMatch(/download=(?:|no|false)(?:&|$)/);
  });
});
