import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Drawing';
const SOURCE_URL   = 'https://docs.google.com/drawings/d/e/2PACX-1vSlcFvwMSTMup-Zep26SNugijQiv59ELFpg9eBWTRfJkDntgFL6c0zS1m6GYawLb5HH2TtT2E5zGFQL/pub?w=960&h=720';
const SEEDED_SLUG  = 'ep-gutenberg-google-drawing';
// Drawings render as <img>, not <iframe>.
const EMBED_SEL    = 'img[src*="docs.google.com/drawings"]';
const URL_MARKER   = '2PACX-1vSlcFvwMSTMup-Zep26SNugij';

test.describe(`Gutenberg verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const embed = page.locator(EMBED_SEL).first();
    await expect(embed).toBeVisible({ timeout: 30_000 });
    await expect(embed).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
