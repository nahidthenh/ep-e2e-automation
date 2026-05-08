import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-wistia';
const MEDIA_ID    = 'kjgpmu64ul';

test.describe('Elementor verify — Wistia', () => {
  test('seeded page emits the wistia wrapper + loader', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    // Elementor wraps it as `wistia_<id>` (vs Gutenberg's `ose-uid-<id>`).
    expect(html).toContain(MEDIA_ID);
    expect(html).toContain('fast.wistia.com/assets/external/E-v1.js');
  });
});
