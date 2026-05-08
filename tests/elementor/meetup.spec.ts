import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-meetup';
// Meetup renders as <img>, not <iframe>.
const EMBED_SEL   = 'img[src*="meetupstatic.com"]';
const URL_MARKER  = '506048857';

test.describe('Elementor verify — Meetup', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const embed = page.locator(EMBED_SEL).first();
    await expect(embed).toBeVisible({ timeout: 30_000 });
    await expect(embed).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
