import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'YouTube';
const SOURCE_URL   = 'https://www.youtube.com/watch?v=5zWTInJqD5k';
const SEEDED_SLUG  = 'ep-gutenberg-youtube';
const IFRAME_SEL   = 'iframe[src*="youtube"]';
const URL_MARKER   = '5zWTInJqD5k';

test.describe(`Gutenberg verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
