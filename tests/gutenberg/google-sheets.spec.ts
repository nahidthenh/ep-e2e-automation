import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'Google Sheets';
const SOURCE_URL   = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpbRtN92JWWvv0LRMRW_8hkHuT-I-UKMNzQOUe8vTD-fuJ_5-_ImcrgdB_V9YkrAB0quBR14xvmjLt/pubhtml';
const SEEDED_SLUG  = 'ep-gutenberg-google-sheets';
const IFRAME_SEL   = 'iframe[src*="docs.google.com/spreadsheets"]';
const URL_MARKER   = '2PACX-1vSpbRtN92JWWvv0LRMRW';

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
