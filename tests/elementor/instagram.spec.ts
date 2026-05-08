import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-instagram';

// Pro Instagram for Elementor needs an InstagramFeed access token (the
// `embedpress/is_allow_rander` Pro filter + an authenticated graph token).
// The test env doesn't provision either, so the widget renders an empty
// shell — we assert the widget shell exists, which proves Elementor +
// EmbedPress wired the URL through to the Instagram path. Full content
// rendering is a follow-up that needs token provisioning.
test.describe('Elementor verify — Instagram (widget shell only)', () => {
  test('seeded page renders the EmbedPress widget shell', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const widget = page.locator('.elementor-widget-embedpres_elementor').first();
    await expect(widget).toBeVisible({ timeout: 30_000 });
  });
});
