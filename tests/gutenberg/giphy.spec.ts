import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-giphy';
// Giphy renders as <img>, not <iframe>.
const EMBED_SEL   = 'img[src*="giphy.com/media"]';
const URL_MARKER  = 'xBAreNGk5DapO';

test.describe('Gutenberg verify — Giphy', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const embed = page.locator(EMBED_SEL).first();
    await expect(embed).toBeVisible({ timeout: 30_000 });
    await expect(embed).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
