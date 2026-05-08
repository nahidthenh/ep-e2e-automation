import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-rumble';
const VIDEO_ID    = 'v6alqqm';

test.describe('Elementor verify — Rumble', () => {
  test('seeded page emits the rumble embed URL', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain('data-embed-type="Rumble"');
    expect(html).toContain(`rumble.com/embed/${VIDEO_ID}`);
  });
});
