import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-pdf-flipbook';

// Elementor's embedpress_pdf widget uses `embedpress_pdf_viewer_style: 'flip-book'`
// to activate the 3D flip-book renderer. The iframe src switches to the WP Ajax
// endpoint admin-ajax.php?action=get_flipbook_viewer&file={encodedUrl}&key={base64}.
// The base64 key encodes flipbook-specific controls including flipbook_toolbar_position.
test.describe('Elementor verify — PDF (flip-book viewer)', () => {
  test('seeded page renders the flip-book iframe via get_flipbook_viewer', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run setup` then `npm run seed`').toBeTruthy();

    const iframe = page.locator('iframe.embedpress-embed-document-pdf').first();
    await expect(iframe).toBeVisible({ timeout: 15_000 });

    const src = await iframe.getAttribute('src');
    expect(src, 'iframe src should reference the sample PDF').toMatch(/sample.*\.pdf/i);
    expect(src, 'flip-book src must use the get_flipbook_viewer Ajax action').toContain('action=get_flipbook_viewer');

    const keyParam = new URL(src!).searchParams.get('key');
    expect(keyParam, 'src must carry a base64 key param').toBeTruthy();
    const params = Buffer.from(keyParam!, 'base64').toString();
    expect(params, 'key payload should contain flip-book-specific param').toContain('flipbook_toolbar_position');
  });
});
