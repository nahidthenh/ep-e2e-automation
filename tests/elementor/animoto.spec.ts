import { test, expect } from '@playwright/test';

const SEEDED_SLUG  = 'ep-elementor-animoto';
const URL_FRAGMENT = 'animoto.com';

test.describe('Elementor verify — Animoto (URL fallback only)', () => {
  test('seeded page emits the source URL fallback', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain(URL_FRAGMENT);
  });
});
